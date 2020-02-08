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
import { Evt } from "ts-evt";
import * as confManager from "./confManager";
import * as types from "./types";
import * as logger from "logger";
import * as db from "./db";
import { InstallOptions } from "./InstallOptions";
import * as hostRebootScheduler from "./hostRebootScheduler";

import { safePr } from "scripting-tools";

const debug = logger.debugFactory();

const modems: types.Modems = new TrackableMap();

const evtScheduleRetry = new Evt<{ 
    accessPointId: AccessPoint["id"]; 
    shouldRebootModem: boolean
}>();

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

    evtScheduleRetry.attach(({accessPointId, shouldRebootModem}) => {

        const accessPoint = Array.from(monitor.connectedModems).find(({ id })=> id === accessPointId);

        if( !accessPoint ){
            return;
        }

        monitor.evtModemDisconnect
            .waitFor(ap => ap === accessPoint, 2000)
            .catch(() => createModem(accessPoint, shouldRebootModem?"REBOOT":undefined))
            ;

    });

};

async function createModem(accessPoint: AccessPoint, reboot?: undefined | "REBOOT" ) {

    debug("Create Modem");

    let modem: Modem;

    try {

        modem = await Modem.create({
            "dataIfPath": accessPoint.dataIfPath,
            "unlock": (modemInfo, iccid, pinState, tryLeft, performUnlock, terminate) =>
                onLockedModem(accessPoint, modemInfo, iccid, pinState, tryLeft, performUnlock, terminate),
            "log": logger.log,
            "rebootFirst": !!reboot
        });

    } catch (error) {

        onModemInitializationFailed(
            accessPoint,
            error as InitializationError
        );

        return;

    }

    onModem(accessPoint, modem);

}

function onModemInitializationFailed(
    accessPoint: AccessPoint,
    initializationError: InitializationError
) {

    modems.delete(accessPoint);

    if( initializationError instanceof InitializationError.DidNotTurnBackOnAfterReboot ){

        hostRebootScheduler.schedule();

        return;

    }

    if( initializationError.modemInfos.hasSim === false ){

        return;

    }

    /*
    NOTE: When we get an initialization error
    after a modem have been successfully rebooted
    do not attempt to reboot it again to prevent
    reboot loop that will conduct to the host being 
    rebooted
    */
    evtScheduleRetry.post({
        "accessPointId": accessPoint.id,
        "shouldRebootModem": 
            !initializationError.modemInfos.successfullyRebooted 
    });

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

    const initializationTime = Date.now();

    modem.evtTerminate.attachOnce(
        error => {

            modems.delete(accessPoint);

            debug(`Modem terminate... ${error ? error.message : "No internal error"}`);

            /** 
             * NOTE: Preventing Modem reboot loop by allowing 
             * modem to be rebooted at most once every hour.
             */
            evtScheduleRetry.post({
                "accessPointId": accessPoint.id,
                "shouldRebootModem": (
                    !!modem["__api_rebootDongle_called__"] ||
                    (
                        !!error &&
                        (
                            !modem.successfullyRebooted ||
                            Date.now() - initializationTime > 3600000
                        )
                    )
                )
            });

        }
    );

    modems.set(accessPoint, modem);

}
