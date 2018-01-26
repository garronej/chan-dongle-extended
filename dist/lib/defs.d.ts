import { Modem, PerformUnlock, AtMessage, AccessPoint } from "ts-gsm-modem";
import { TrackableMap } from "trackable-map";
export interface LockedModem {
    imei: string;
    manufacturer: string;
    model: string;
    firmwareVersion: string;
    iccid: string | undefined;
    pinState: AtMessage.LockedPinState;
    tryLeft: number;
    performUnlock: PerformUnlock;
}
export declare type Modems = TrackableMap<AccessPoint, Modem | LockedModem>;
export declare function matchLockedModem(modem: any): modem is LockedModem;
export declare function matchModem(modem: any): modem is Modem;
