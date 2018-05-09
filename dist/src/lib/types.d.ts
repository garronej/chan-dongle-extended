import { Modem, PerformUnlock, AtMessage, AccessPoint } from "ts-gsm-modem";
import { TrackableMap } from "trackable-map";
export declare type LockedModem = {
    imei: string;
    manufacturer: string;
    model: string;
    firmwareVersion: string;
    iccid: string | undefined;
    pinState: AtMessage.LockedPinState;
    tryLeft: number;
    performUnlock: PerformUnlock;
};
export declare namespace LockedModem {
    function match(modem: any): modem is LockedModem;
}
export declare type Modems = TrackableMap<AccessPoint, Modem | LockedModem>;
export declare function matchModem(modem: any): modem is Modem;
