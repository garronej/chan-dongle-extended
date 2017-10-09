
import {
    Modem,
    InitializationError,
    UnlockResult,
    PerformUnlock,
    AtMessage,
    AccessPoint
} from "ts-gsm-modem";

import { TrackableMap } from "trackable-map";

export interface LockedModem {
    imei: string;
    iccid: string | undefined;
    pinState: AtMessage.LockedPinState;
    tryLeft: number;
    performUnlock: PerformUnlock;
}

export type Modems= TrackableMap<AccessPoint, Modem | LockedModem>;

export function matchLockedModem(modem: any ): modem is LockedModem {
    try{
        return !!(modem as LockedModem).performUnlock;
    }catch{
        return false;
    }
}

export function matchModem(modem: any): modem is Modem {
    return modem instanceof Modem;
}



