import {
    Modem,
    InitializationError,
    UnlockResult,
    AccessPoint,
    ConnectionMonitor,
    AtMessage,
    PerformUnlock
} from "ts-gsm-modem";
import { TrackableMap } from "trackable-map";
import * as storage from "./appStorage";
import { misc as dcMisc } from "../chan-dongle-extended-client";
import { Ami } from "ts-ami";
import * as repl from "./repl";
import * as dialplan from "./dialplan";
import * as api from "./api";
import * as bridge from "./bridge";
import { SyncEvent } from "ts-events-extended";
import * as chanDongleConfManager from "./chanDongleConfManager";
import * as types from "./types";
import { log, clearCurrentLog, backupCurrentLog } from "./logger";
import { execSync } from "child_process";

import * as localManger from "./localsManager";

import * as _debug from "debug";
let debug = _debug("main");
debug.enabled = true;
debug.log = log;


const modems: types.Modems = new TrackableMap();
const evtScheduleRetry = new SyncEvent<AccessPoint>();

export async function launch() {

    const { locals } = localManger.get();

    clearCurrentLog();

    const ami = Ami.getInstance(dcMisc.amiUser);

    const chanDongleConfManagerApi = chanDongleConfManager.getApi(ami);

    (() => {

        const onExit: any = async (signal, code) => {

            if (code !== 0) {

                backupCurrentLog();

            }

            try {

                await chanDongleConfManagerApi.reset();

            } catch{ }

            process.exit(code);

        }

        process.once("SIGINT", onExit);
        process.once("SIGUSR1", onExit);

        process.once("beforeExit", code => onExit("", code));

        process.removeAllListeners("uncaughtException");

        process.once("uncaughtException", error => {

            debug("uncaughtException", error);

            onExit("", -1);

        });

        process.removeAllListeners("unhandledRejection");

        process.once("unhandledRejection", error => {

            debug("unhandledRejection", error);

            onExit("", -1);

        });

    })();

    console.assert(
        locals.build_across_linux_kernel === `${execSync("uname -r")}`,
        "Kernel have been updated, need re install"
    );

    if (!locals.disable_sms_dialplan) {

        dialplan.init(
            modems,
            ami,
            chanDongleConfManagerApi.staticModuleConfiguration.defaults["context"],
            chanDongleConfManagerApi.staticModuleConfiguration.defaults["exten"]
        );

    }

    await bridge.init(modems, chanDongleConfManagerApi);

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
                unlock(accessPoint, modemInfo, iccid, pinState, tryLeft, performUnlock),
            log,
        });

    } catch (error) {

        modems.delete(accessPoint);

        let initializationError: InitializationError = error;

        debug(`Initialization error: ${initializationError.message}`);

        let { modemInfos } = initializationError;

        if (modemInfos.hasSim !== false) {
            evtScheduleRetry.post(accessPoint);
        }

        return;

    }

    modem.evtTerminate.attachOnce(
        error => {

            modems.delete(accessPoint);

            debug(`Terminate... ${error ? error.message : "No internal error"}`);

            evtScheduleRetry.post(accessPoint);

        }
    );

    modems.set(accessPoint, modem);

}


async function unlock(
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