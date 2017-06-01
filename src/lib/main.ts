require("rejection-tracker").main(__dirname, "..", "..");

import {
    Modem,
    UnlockCodeProviderCallback,
    AtMessage
} from "ts-gsm-modem";
import { Monitor, AccessPoint } from "gsm-modem-connection";
import { TrackableMap } from "trackable-map";
import * as appStorage from "./appStorage";

import * as _debug from "debug";
let debug = _debug("_main");

export const activeModems = new TrackableMap<string, {
    modem: Modem;
    accessPoint: AccessPoint;
    dongleName: string;
}>();

export const lockedModems = new TrackableMap<string, {
    iccid: string;
    pinState: AtMessage.LockedPinState;
    tryLeft: number;
    callback: UnlockCodeProviderCallback;
}>();



if (process.env["NODE_ENV"] !== "production") require("./repl");
import "./evtLogger";

import "./main.ami";
import "./main.bridge";

debug("Daemon started!");

Monitor.evtModemDisconnect.attach(accessPoint => debug(`DISCONNECT: ${accessPoint.toString()}`));

Monitor.evtModemConnect.attach(async accessPoint => {

    debug(`CONNECT: ${accessPoint.toString()}`);

    let [error, modem, hasSim] = await Modem.create({
        "path": accessPoint.dataIfPath,
        "unlockCodeProvider":
        (imei, iccid, pinState, tryLeft, callback) =>
            lockedModems.set(imei, { iccid, pinState, tryLeft, callback })
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

        lockedModems.delete(modem.imei);
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