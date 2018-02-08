require("rejection-tracker").main(__dirname, "..", "..");

//"postinstall": "if [ $(id -u) -eq 0  ]; then (node ./dist/bin/scripts postinstall); else (sudo node ./dist/bin/scripts postinstall); fi",
// lrwxrwxrwx 1 root pi 36 Apr 15 09:46 /usr/local/lib/node_modules/chan-dongle-extended -> /home/pi/github/chan-dongle-extended

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
import { LockedModem, Modems } from "./defs";
import { Ami, misc } from "../chan-dongle-extended-client";
import amiUser = misc.amiUser;

import * as repl from "./repl";
import * as dialplan from "./dialplan";
import * as api from "./api";
import * as bridge from "./bridge";

import * as _debug from "debug";
let debug = _debug("_main");

const modems: Modems = new TrackableMap();

const ami = Ami.getInstance(amiUser);

bridge.start(modems);
dialplan.start(modems, ami);
api.start(modems, ami);

if (process.env["NODE_ENV"] !== "production") {

    repl.start(modems);

}

debug("Started");

const monitor = ConnectionMonitor.getInstance();

monitor.evtModemConnect.attach(accessPoint => {

    debug(`CONNECT: ${accessPoint.toString()}`);

    createModem(accessPoint);

});

function scheduleRetry(accessPoint: AccessPoint) {

    if (!monitor.connectedModems.has(accessPoint)) return;

    monitor.evtModemDisconnect.waitFor(ap => ap === accessPoint, 2000)
        .catch(() => createModem(accessPoint));

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

    let lockedModem: LockedModem = {
        "imei": modemInfos.imei,
        "manufacturer": modemInfos.manufacturer, 
        "model": modemInfos.model,
        "firmwareVersion": modemInfos.firmwareVersion,
        iccid, pinState, tryLeft,
        "performUnlock": async (...inputs) => {
            //NOTE: Perform result throw error if modem disconnect during unlock

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

async function createModem(accessPoint: AccessPoint) {

    debug("Create Modem");

    let modem: Modem;

    try {

        modem = await Modem.create({
            "enableTrace": true,
            "dataIfPath": accessPoint.dataIfPath,
            "unlock": (modemInfo, iccid, pinState, tryLeft, performUnlock) =>
                unlock(accessPoint, modemInfo, iccid, pinState, tryLeft, performUnlock)
        });

    } catch (error) {

        modems.delete(accessPoint);

        let initializationError: InitializationError = error;

        debug(`Initialization error: ${initializationError.message}`);

        let { modemInfos } = initializationError;

        if (modemInfos.hasSim !== false ) {
            scheduleRetry(accessPoint);
        }

        return;

    }

    modem.evtTerminate.attachOnce(
        error => {

            modems.delete(accessPoint);

            debug(`Terminate... ${error?error.message:"No internal error"}`);

            scheduleRetry(accessPoint);

        }
    );

    modems.set(accessPoint, modem);

}
