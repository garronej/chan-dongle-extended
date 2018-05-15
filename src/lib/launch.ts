import {
    Modem, InitializationError, UnlockResult, AccessPoint,
    ConnectionMonitor, AtMessage, PerformUnlock 
} from "ts-gsm-modem";
import { TrackableMap } from "trackable-map";
import * as storage from "./appStorage";
import { AmiCredential } from "./AmiCredential";
import { Ami } from "ts-ami";
import * as repl from "./repl";
import * as dialplan from "./dialplan";
import * as api from "./api";
import * as atBridge from "./atBridge";
import { SyncEvent } from "ts-events-extended";
import * as confManager from "./confManager";
import * as types from "./types";
import { log, backupCurrentLog, createCrashReport } from "./logger";

import {InstallOptions} from "./InstallOptions";

import "colors";

import * as debugFactory from "debug";
let debug = debugFactory("main");
debug.enabled = true;
debug.log = log;

const modems: types.Modems = new TrackableMap();
const evtScheduleRetry = new SyncEvent<AccessPoint>();

export async function launch() {

    const installOptions= InstallOptions.get();

    const ami = Ami.getInstance(AmiCredential.get());

    const chanDongleConfManagerApi = await confManager.getApi(ami);

    setExitHandlers(chanDongleConfManagerApi);

    if (!installOptions.disable_sms_dialplan) {

        let { defaults } = chanDongleConfManagerApi.staticModuleConfiguration;

        dialplan.init(modems, ami, defaults["context"], defaults["exten"]);

    }

    await atBridge.init(modems, chanDongleConfManagerApi);

    await api.launch(modems, chanDongleConfManagerApi.staticModuleConfiguration);

    if (process.env["NODE_ENV"] !== "production") {

        repl.start(modems);

    }

    debug("Started");

    const monitor = ConnectionMonitor.getInstance(log);

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
            log,
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

    let appData = await storage.read();

    let pin = appData.pins[iccid || modemInfos.imei];

    if (pin) {

        if (pinState === "SIM PIN" && tryLeft === 3) {

            let unlockResult = await performUnlock(pin);

            if (unlockResult.success) return;

            pinState = unlockResult.pinState;
            tryLeft = unlockResult.tryLeft;

        } else {

            delete appData.pins[iccid || modemInfos.imei];

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

            let appData = await storage.read();

            if (unlockResult.success) {

                debug(`Persistent storing of pin: ${pin}`);

                appData.pins[iccid || modemInfos.imei] = pin;

            } else {

                delete appData.pins[iccid || modemInfos.imei];

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

function setExitHandlers(
    chanDongleConfManagerApi: confManager.Api
) {

    const cleanupAndExit = async (code: number) => {

        const exitSync = () => {

            if (code !== 0) {

                debug("Create crash report");

                createCrashReport();

            } else {

                debug("Backup log");

                backupCurrentLog();

            }

            process.exit(code);

        };

        debug(`cleaning up and exiting with code ${code}`);

        setTimeout(() => {

            debug("Force quit");

            exitSync();

        }, 2000);

        try {

            await chanDongleConfManagerApi.reset();

        } catch{ }

        exitSync();

    }

    //Ctrl+C
    process.once("SIGINT", () => {

        debug("Ctrl+C pressed ( SIGINT )");

        cleanupAndExit(2);

    });

    process.once("SIGUSR2", () => {

        debug("Stop script called (SIGUSR2)");

        cleanupAndExit(0);

    });

    process.once("beforeExit", code => cleanupAndExit(code));

    process.removeAllListeners("uncaughtException");

    process.once("uncaughtException", error => {

        debug("uncaughtException", error);

        cleanupAndExit(-1);

    });

    process.removeAllListeners("unhandledRejection");

    process.once("unhandledRejection", error => {

        debug("unhandledRejection", error);

        cleanupAndExit(-1);

    });

}