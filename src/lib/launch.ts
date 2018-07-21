import {
    Modem, InitializationError, UnlockResult, AccessPoint,
    ConnectionMonitor, AtMessage, PerformUnlock 
} from "ts-gsm-modem";
import { TrackableMap } from "trackable-map";
import { AmiCredential } from "./AmiCredential";
import { Ami } from "ts-ami";
import * as dialplan from "./dialplan";
import * as api from "./api";
import * as atBridge from "./atBridge";
import { SyncEvent } from "ts-events-extended";
import * as confManager from "./confManager";
import * as types from "./types";
import * as logger from "logger";
import * as db from "./db";
import { InstallOptions } from "./InstallOptions";

import { safePr } from "scripting-tools";

const debug = logger.debugFactory();

const modems: types.Modems = new TrackableMap();

const evtScheduleRetry = new SyncEvent<AccessPoint["id"]>();

export async function beforeExit() {

    debug("Start before exit...");

    if (ConnectionMonitor.hasInstance) {
        ConnectionMonitor.getInstance().stop();
    }

    await Promise.all([
        safePr(db.beforeExit()),
        safePr(api.beforeExit()),
        safePr(atBridge.waitForTerminate()),
        Promise.all(
            Array.from(modems.values())
                .map(modem => safePr(modem.terminate()))
        ),
        (async () => {

            await safePr(confManager.beforeExit(), 1500);

            if (Ami.hasInstance) {
                await Ami.getInstance().disconnect();
            }

        })()
    ]);

}

export async function launch() {

    const installOptions = InstallOptions.get();

    const ami = Ami.getInstance(AmiCredential.get());

    ami.evtTcpConnectionClosed.attachOnce(() => {

        debug("TCP connection with Asterisk manager closed, reboot");

        process.emit("beforeExit", process.exitCode = 0);

    });

    const chanDongleConfManagerApi = await confManager.getApi(ami);

    await db.launch();

    if (!installOptions.disable_sms_dialplan) {

        const { defaults } = chanDongleConfManagerApi.staticModuleConfiguration;

        dialplan.init(modems, ami, defaults["context"], defaults["exten"]);

    }

    await atBridge.init(modems, chanDongleConfManagerApi);

    await api.launch(modems, chanDongleConfManagerApi.staticModuleConfiguration);

    debug("Started");

    const monitor = ConnectionMonitor.getInstance();

    monitor.evtModemConnect.attach(accessPoint => {

        debug(`(Monitor) Connect: ${accessPoint}`);

        createModem(accessPoint)

    });

    monitor.evtModemDisconnect.attach(
        accessPoint=> debug(`(Monitor) Disconnect: ${accessPoint}`)
    );

    evtScheduleRetry.attach(accessPointId => {

        const accessPoint = Array.from(monitor.connectedModems).find(({ id })=> id === accessPointId);

        if( !accessPoint ){
            return;
        }

        monitor.evtModemDisconnect
            .waitFor(ap => ap === accessPoint, 2000)
            .catch(() => createModem(accessPoint))
            ;

    });

};

async function createModem(accessPoint: AccessPoint) {

    debug("Create Modem");

    let modem: Modem;

    try {

        modem = await Modem.create({
            "dataIfPath": accessPoint.dataIfPath,
            "unlock": (modemInfo, iccid, pinState, tryLeft, performUnlock, terminate) =>
                onLockedModem(accessPoint, modemInfo, iccid, pinState, tryLeft, performUnlock, terminate),
            "log": logger.log
        });

    } catch (error) {

        onModemInitializationFailed(
            accessPoint,
            error.message,
            (error as InitializationError).modemInfos
        );

        return;

    }

    onModem(accessPoint, modem);

}

function onModemInitializationFailed(
    accessPoint: AccessPoint,
    message: string,
    modemInfos: InitializationError["modemInfos"]
) {

    debug(`Modem initialization failed: ${message}`.red, modemInfos);

    modems.delete(accessPoint);

    if (modemInfos.hasSim !== false) {
        evtScheduleRetry.post(accessPoint.id);
    }

}

async function onLockedModem(
    accessPoint: AccessPoint,
    modemInfos: {
        imei: string;
        manufacturer: string;
        model: string;
        firmwareVersion: string;
    },
    iccid: string | undefined,
    pinState: AtMessage.LockedPinState,
    tryLeft: number,
    performUnlock: PerformUnlock,
    terminate: () => Promise<void>
) {

    debug("onLockedModem", { ...modemInfos, iccid, pinState, tryLeft });

    const associatedTo: db.pin.AssociatedTo = !!iccid ? ({ iccid }) : ({ "imei": modemInfos.imei });

    const pin = await db.pin.get(associatedTo);

    if (!!pin) {

        if (pinState === "SIM PIN" && tryLeft === 3) {

            let unlockResult = await performUnlock(pin);

            if (unlockResult.success) {
                return;
            }

            pinState = unlockResult.pinState;
            tryLeft = unlockResult.tryLeft;

        } else {

            await db.pin.save(undefined, associatedTo);

        }

    }


    const lockedModem: types.LockedModem = {
        "imei": modemInfos.imei,
        "manufacturer": modemInfos.manufacturer,
        "model": modemInfos.model,
        "firmwareVersion": modemInfos.firmwareVersion,
        iccid, pinState, tryLeft,
        "performUnlock": async (...inputs) => {
            //NOTE: PerformUnlock throw error if modem disconnect during unlock

            modems.delete(accessPoint);

            let pin: string;
            let puk: string | undefined;
            let unlockResult: UnlockResult;

            if (!inputs[1]) {

                pin = inputs[0];
                puk = undefined;

                unlockResult = await performUnlock(pin);

            } else {

                pin = inputs[1];
                puk = inputs[0];

                unlockResult = await performUnlock(puk!, pin);

            }

            if (unlockResult.success) {

                debug(`Persistent storing of pin: ${pin}`);

                await db.pin.save(pin, associatedTo);

            } else {

                await db.pin.save(undefined, associatedTo);

                lockedModem.pinState = unlockResult.pinState;
                lockedModem.tryLeft = unlockResult.tryLeft;

                modems.set(accessPoint, lockedModem);

            }

            return unlockResult;

        },
        terminate
    };

    modems.set(accessPoint, lockedModem);

}

function onModem(
    accessPoint: AccessPoint,
    modem: Modem
) {

    debug("Modem successfully initialized".green);

    modem.evtTerminate.attachOnce(
        error => {

            modems.delete(accessPoint);

            debug(`Modem terminate... ${error ? error.message : "No internal error"}`);

            evtScheduleRetry.post(accessPoint.id);

        }
    );

    modems.set(accessPoint, modem);

}
