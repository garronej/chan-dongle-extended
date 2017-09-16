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

    return `Dongle${match ? match[1] : md5(audioIfPath).substring(0, 6)}`;

}

export async function storeSimPin(modem: Modem){

        if (modem.pin) {

            debug(`Persistent storing of pin: ${modem.pin}`);

            if (modem.iccidAvailableBeforeUnlock)
                debug(`for SIM ICCID: ${modem.iccid}`);
            else
                debug([
                    `for dongle IMEI: ${modem.imei}, because SIM ICCID `,
                    `is not readable with this dongle when SIM is locked`
                ].join(""));

            let appData = await appStorage.read();

            appData.pins[modem.iccidAvailableBeforeUnlock ? modem.iccid : modem.imei] = modem.pin;

            appData.release();

        }

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

const accessPointOfModemWithoutSim= new Set<AccessPoint>();

const onModemConnect = runExclusive.build(
    async (accessPoint: AccessPoint) => {

        if (
            Monitor.connectedModems.indexOf(accessPoint) < 0 ||
            activeModems.has(accessPoint) ||
            lockedModems.has(accessPoint)
        ) return;

        debug(`CONNECT: ${accessPoint.toString()}`);

        let evtDisconnect = new VoidSyncEvent();

        let [error, modem, hasSim] = await Modem.create({
            "path": accessPoint.dataIfPath,
            "unlockCodeProvider": (imei, iccid, pinState, tryLeft, callback) => {

                Monitor.evtModemDisconnect.attachOnce(
                    ({ id }) => id === accessPoint.id,
                    () => evtDisconnect.post()
                );

                lockedModems.set(accessPoint, {
                    imei,
                    iccid,
                    pinState,
                    tryLeft,
                    callback,
                    evtDisconnect
                });

            }
        });

        if (error) {

            debug("Initialization error, checking if unlock was successful...".red, error);

            storeSimPin(modem);

            evtDisconnect.post();
            return;
        }

        if (!hasSim){

            debug("No sim!".red);

            accessPointOfModemWithoutSim.add(accessPoint);

            modem.terminate();

            return;

        }

        activeModems.set(accessPoint, modem);

        modem.evtTerminate.attachOnce(async error => {

            debug("Modem evt terminate");

            if (error) debug("terminate reason: ", error);

            activeModems.delete(accessPoint);

        });
    }
);


Monitor.evtModemConnect.attach(onModemConnect);

Monitor.evtModemDisconnect.attach(accessPoint => debug(`DISCONNECT: ${accessPoint.toString()}`));

(async function periodicalChecks() {

    while (true) {

        await new Promise(resolve => setTimeout(resolve, 5000));

        for (let accessPoint of Monitor.connectedModems){

            if( accessPointOfModemWithoutSim.has(accessPoint) ) continue;

            onModemConnect(accessPoint);

        }

    }

})();
