require("rejection-tracker").main(__dirname, "..", "..");

 //"postinstall": "if [ $(id -u) -eq 0  ]; then (node ./dist/bin/scripts postinstall); else (sudo node ./dist/bin/scripts postinstall); fi",
 // lrwxrwxrwx 1 root pi 36 Apr 15 09:46 /usr/local/lib/node_modules/chan-dongle-extended -> /home/pi/github/chan-dongle-extended

import {
    Modem,
    UnlockCodeProviderCallback,
    AtMessage
} from "ts-gsm-modem";
import { Monitor, AccessPoint } from "gsm-modem-connection";
import { VoidSyncEvent } from "ts-events-extended";
import { TrackableMap } from "trackable-map";
import * as appStorage from "./appStorage";


import * as _debug from "debug";
let debug = _debug("_main");

export interface ActiveModem {
    modem: Modem;
    accessPoint: AccessPoint;
    dongleName: string;
}

export const activeModems = new TrackableMap<string, ActiveModem>();

export interface LockedModem {
    iccid: string;
    pinState: AtMessage.LockedPinState;
    tryLeft: number;
    callback: UnlockCodeProviderCallback;
    evtDisconnect: VoidSyncEvent;
}

export const lockedModems = new TrackableMap<string, LockedModem>();



if (process.env["NODE_ENV"] !== "production") require("./repl");
import "./evtLogger";

import "./main.ami";
import "./main.bridge";

debug("Daemon started!");

Monitor.evtModemDisconnect.attach(accessPoint => debug(`DISCONNECT: ${accessPoint.toString()}`));

Monitor.evtModemConnect.attach(async accessPoint => {

    debug(`CONNECT: ${accessPoint.toString()}`);

    let evtDisconnect = new VoidSyncEvent();

    let [error, modem, hasSim] = await Modem.create({
        "path": accessPoint.dataIfPath,
        "unlockCodeProvider":
        (imei, iccid, pinState, tryLeft, callback) => {

            Monitor.evtModemDisconnect.attachOnce(
                ({ id })=> id === accessPoint.id,
                ()=> evtDisconnect.post()
            );

            lockedModems.set(imei, {
                iccid, pinState, tryLeft, callback, evtDisconnect
            });

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


    let dongleName = "Dongle" + modem.imei.substring(0, 3) + modem.imei.substring(modem.imei.length - 3);

    activeModems.set(modem.imei, { modem, accessPoint, dongleName });


    modem.evtTerminate.attachOnce( async error => {

        debug("Modem evt terminate");

        if( error )
            debug("terminate reason: ", error);

        activeModems.delete(modem.imei);

        if( Monitor.connectedModems.indexOf( accessPoint ) >= 0 ){

            debug("Modem still connected");

            try{

                await Monitor.evtModemDisconnect.waitFor(ac => ac === accessPoint, 5000);

                debug("Modem as really disconnected");
                
            }catch(timeout){

                debug("Modem still here, re-initializing");

                Monitor.evtModemConnect.post(accessPoint);

            }

        }



    });

});