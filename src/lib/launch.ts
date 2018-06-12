import {
    Modem, InitializationError, UnlockResult, AccessPoint,
    ConnectionMonitor, AtMessage, PerformUnlock 
} from "ts-gsm-modem";
import { TrackableMap } from "trackable-map";
import { AmiCredential } from "./AmiCredential";
import { Ami } from "ts-ami";
import * as repl from "./repl";
import * as dialplan from "./dialplan";
import * as api from "./api";
import * as atBridge from "./atBridge";
import { SyncEvent } from "ts-events-extended";
import * as confManager from "./confManager";
import * as types from "./types";
import * as logger from "logger";
import * as db from "./db";
import { InstallOptions } from "./InstallOptions";

const debug = logger.debugFactory();

const modems: types.Modems = new TrackableMap();
const evtScheduleRetry = new SyncEvent<AccessPoint>();

//TODO: check if we can update this.
export let beforeExit: ()=> Promise<void> = async ()=> {};

export async function launch() {

    const installOptions= InstallOptions.get();

    const ami = Ami.getInstance(AmiCredential.get());

    ami.evtTcpConnectionClosed.attachOnce(()=>{ 

        throw new Error("Asterisk TCP connection closed"); 

    });

    const chanDongleConfManagerApi = await confManager.getApi(ami);

    beforeExit= ()=> chanDongleConfManagerApi.reset();

    await db.launch();

    if (!installOptions.disable_sms_dialplan) {

        let { defaults } = chanDongleConfManagerApi.staticModuleConfiguration;

        dialplan.init(modems, ami, defaults["context"], defaults["exten"]);

    }

    await atBridge.init(modems, chanDongleConfManagerApi);

    await api.launch(modems, chanDongleConfManagerApi.staticModuleConfiguration);

    if (process.env["NODE_ENV"] !== "production") {

        debug("Enabling repl");

        repl.start(modems);

    }

    debug("Started");

    const monitor = ConnectionMonitor.getInstance(logger.log);

    monitor.evtModemConnect.attach(accessPoint => createModem(accessPoint));

    evtScheduleRetry.attach(accessPoint => {

        if (!monitor.connectedModems.has(accessPoint)) {
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
            "unlock": (modemInfo, iccid, pinState, tryLeft, performUnlock) =>
                onLockedModem(accessPoint, modemInfo, iccid, pinState, tryLeft, performUnlock),
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
        evtScheduleRetry.post(accessPoint);
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
    performUnlock: PerformUnlock
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


    let lockedModem: types.LockedModem = {
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

            if( unlockResult.success ){

                debug(`Persistent storing of pin: ${pin}`);

                await db.pin.save(pin, associatedTo);

            }else{

                await db.pin.save(undefined, associatedTo);

                lockedModem.pinState = unlockResult.pinState;
                lockedModem.tryLeft = unlockResult.tryLeft;

                modems.set(accessPoint, lockedModem);

            }

            return unlockResult;

        }
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

            debug(`Terminate... ${error ? error.message : "No internal error"}`);

            evtScheduleRetry.post(accessPoint);

        }
    );

    modems.set(accessPoint, modem);

}
