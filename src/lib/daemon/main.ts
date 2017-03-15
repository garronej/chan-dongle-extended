import { 
    Modem, 
    UnlockCodeProviderCallback, 
    AtMessage
} from "../../../../ts-gsm-modem/out/lib/index";
import { Monitor, AccessPoint } from "gsm-modem-connection";
import { TrackableMap } from "trackable-map";

import * as _debug from "debug";
let debug= _debug("_main");

process.on("unhandledRejection", error=> { 
    console.log("INTERNAL ERROR".red);
    console.log(error);
    throw error;
});


export const activeModems= new TrackableMap<string, {
    modem: Modem;
    accessPoint: AccessPoint;
}>();

export const lockedModems= new TrackableMap<string, {
        iccid: string;
        pinState: AtMessage.LockedPinState;
        tryLeft: number;
        callback: UnlockCodeProviderCallback;
}>();

require("./main.ami");
require("./main.bridge");

Monitor.evtModemDisconnect.attach( accessPoint => debug(`DISCONNECT: ${accessPoint.toString()}`));

Monitor.evtModemConnect.attach(accessPoint => {

    debug(`CONNECT: ${accessPoint.toString()}`);

    Modem.create({
        "path": accessPoint.dataIfPath,
        "unlockCodeProvider":
        (imei, iccid, pinState, tryLeft, callback) => 
            lockedModems.set(imei, { iccid, pinState, tryLeft, callback })
    }, async (error, modem, hasSim) => {

        if( error )
            return debug("Initialization error".red, error);

        if (!hasSim) 
            return debug("No sim!".red);

        debug(`Modem ${modem.imei} enabled`);

        activeModems.set(modem.imei, { modem, accessPoint });

    });

});


/*
(async () => {

    while (true) {

        await new Promise(resolve => setTimeout(() => resolve(), 10000));

        console.log("up");

    }

})();
*/