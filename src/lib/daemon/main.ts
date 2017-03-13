import { 
    Modem, 
    UnlockCodeProviderCallback, 
    LockedPinState 
} from "../../../../ts-gsm-modem/out/lib/index";
import { ModemWatcher, Modem as ModemAccessPoint } from "gsm-modem-connection";
import { TrackableMap } from "../tools/TrackableMap";

import * as _debug from "debug";
let debug= _debug("_main");

process.on("unhandledRejection", error=> { 
    console.log("INTERNAL ERROR".red);
    console.log(error);
    throw error;
});


export const activeModems= new TrackableMap<string, {
    modem: Modem;
    accessPoint: ModemAccessPoint;
}>();

export const lockedModems= new TrackableMap<string, {
        iccid: string;
        pinState: LockedPinState;
        tryLeft: number;
        callback: UnlockCodeProviderCallback;
}>();

require("./main.ami");
require("./main.bridge");

const modemWatcher = new ModemWatcher();

modemWatcher.evtConnect.attach(accessPoint => {

    debug(accessPoint.infos);

    //modemWatcher.stop();

    Modem.create({
        "path": accessPoint.atInterface,
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