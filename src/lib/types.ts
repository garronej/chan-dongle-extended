
import {
    Modem,
    PerformUnlock,
    AtMessage,
    AccessPoint
} from "ts-gsm-modem";

import { TrackableMap } from "trackable-map";

export type LockedModem= {
    imei: string;
    manufacturer: string;
    model: string;
    firmwareVersion: string;
    iccid: string | undefined;
    pinState: AtMessage.LockedPinState;
    tryLeft: number;
    performUnlock: PerformUnlock;
};

export namespace LockedModem {

    export function match(modem: any): modem is LockedModem {
        try {
            return !!(modem as LockedModem).performUnlock;
        } catch{
            return false;
        }
    }
}

export type Modems = TrackableMap<AccessPoint, Modem | LockedModem>;

export function matchModem(modem: any): modem is Modem {
    return modem instanceof Modem;
}


