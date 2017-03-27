import {
    Modem,
    UnlockCodeProviderCallback,
    AtMessage
} from "../../../../ts-gsm-modem/dist/lib/index";
import { Monitor, AccessPoint } from "gsm-modem-connection";
import { TrackableMap } from "trackable-map";
import { Storage } from "./lib/Storage";

import * as _debug from "debug";
let debug = _debug("_main");




export const activeModems = new TrackableMap<string, {
    modem: Modem;
    accessPoint: AccessPoint;
}>();

export const lockedModems = new TrackableMap<string, {
    iccid: string;
    pinState: AtMessage.LockedPinState;
    tryLeft: number;
    callback: UnlockCodeProviderCallback;
}>();

namespace Validation {
    export interface StringValidator {
        isAcceptable(s: string): boolean;
    }
}


if (process.env["NODE_ENV"] !== "production") require("./repl");
require("./evtLogger");

import "./main.ami";
import "./main.bridge";

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

            let data = await Storage.read();

            data.pins[modem.iccidAvailableBeforeUnlock ? modem.iccid : modem.imei] = modem.pin;

            await Storage.write(data);

        }

        lockedModems.delete(modem.imei);
        return;
    }

    if (!hasSim)
        return debug("No sim!".red);



    activeModems.set(modem.imei, { modem, accessPoint });
    modem.evtTerminate.attachOnce( error => {

        debug("Modem evt terminate");

        if( error ){
            debug("terminate reason: ", error);
        }

        activeModems.delete(modem.imei);

    });

});