require("rejection-tracker").main(__dirname, "..", "..");

 //"postinstall": "if [ $(id -u) -eq 0  ]; then (node ./dist/bin/scripts postinstall); else (sudo node ./dist/bin/scripts postinstall); fi",
 // lrwxrwxrwx 1 root pi 36 Apr 15 09:46 /usr/local/lib/node_modules/chan-dongle-extended -> /home/pi/github/chan-dongle-extended

import * as md5 from "md5";
import {
    Modem,
    UnlockCodeProviderCallback,
    AtMessage
} from "ts-gsm-modem";
import { Monitor, AccessPoint } from "gsm-modem-connection";
import { VoidSyncEvent } from "ts-events-extended";
import { TrackableMap } from "trackable-map";
import * as runExclusive from "run-exclusive";
import * as appStorage from "./appStorage";

import * as _debug from "debug";
let debug = _debug("_main");


export function getDongleName(accessPoint: AccessPoint) {

    let { audioIfPath }= accessPoint;

    let match = audioIfPath.match(/^\/dev\/ttyUSB([0-9]+)$/);

    return `Dongle${match?match[1]:md5(audioIfPath).substring(0,6)}`;

}

export interface LockedModem {
    imei: string;
    iccid: string;
    pinState: AtMessage.LockedPinState;
    tryLeft: number;
    callback: UnlockCodeProviderCallback;
    evtDisconnect: VoidSyncEvent;
}

export const lockedModems = new TrackableMap<AccessPoint, LockedModem>();

export const activeModems = new TrackableMap<AccessPoint, Modem>();

if (process.env["NODE_ENV"] !== "production") require("./repl");
import "./evtLogger";

import "./main.ami";
import "./main.bridge";

debug("Daemon started!");

Monitor.evtModemDisconnect.attach(accessPoint => debug(`DISCONNECT: ${accessPoint.toString()}`));

/*
Monitor.evtModemConnect.attach(
    runExclusive.build(
        async (accessPoint: AccessPoint) => {




        }
    )
);
*/

Monitor.evtModemConnect.attach(async accessPoint => {

    debug(`CONNECT: ${accessPoint.toString()}`);

    let evtDisconnect = new VoidSyncEvent();

    let [error, modem, hasSim] = await Modem.create({
        "path": accessPoint.dataIfPath,
        "unlockCodeProvider": (imei, iccid, pinState, tryLeft, callback) => {

            Monitor.evtModemDisconnect.attachOnce(
                ({ id }) => id === accessPoint.id,
                () => evtDisconnect.post()
            );

            let lockedModem: LockedModem = {
                imei,
                iccid,
                pinState,
                tryLeft,
                callback,
                evtDisconnect
            };

            lockedModems.set(accessPoint, lockedModem);

        }
    });


    if (error) {
        debug("Initialization error".red, error);

        if (modem.pin) {

            debug(`Still unlock was successful so, Persistent storing of pin: ${modem.pin}`);

            if (modem.iccidAvailableBeforeUnlock)
                debug(`for SIM ICCID: ${modem.iccid}`);
            else
                debug(`for dongle IMEI: ${modem.imei}, because SIM ICCID is not readable with this dongle when SIM is locked`);

            let appData = await appStorage.read();

            appData.pins[modem.iccidAvailableBeforeUnlock ? modem.iccid : modem.imei] = modem.pin;

            appData.release();

        }

        evtDisconnect.post();
        return;
    }

    if (!hasSim)
        return debug("No sim!".red);

    activeModems.set(accessPoint, modem );

    modem.evtTerminate.attachOnce(async error => {

        debug("Modem evt terminate");

        if (error)
            debug("terminate reason: ", error);

        activeModems.delete(accessPoint);

        if (Monitor.connectedModems.indexOf(accessPoint) >= 0) {

            debug("Modem still connected");

            try {

                await Monitor.evtModemDisconnect.waitFor(ac => ac === accessPoint, 5000);

                debug("Modem as really disconnected");

            } catch (timeout) {

                debug("Modem still here, re-initializing");

                Monitor.evtModemConnect.post(accessPoint);

            }

        }


    });

});

