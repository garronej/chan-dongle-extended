import { Modem, UnlockCodeProviderCallback, AtMessage } from "ts-gsm-modem";
import { AccessPoint } from "gsm-modem-connection";
import { VoidSyncEvent } from "ts-events-extended";
import { TrackableMap } from "trackable-map";
export interface ActiveModem {
    modem: Modem;
    accessPoint: AccessPoint;
    dongleName: string;
}
export declare const activeModems: TrackableMap<string, ActiveModem>;
export interface LockedModem {
    iccid: string;
    pinState: AtMessage.LockedPinState;
    tryLeft: number;
    callback: UnlockCodeProviderCallback;
    evtDisconnect: VoidSyncEvent;
}
export declare const lockedModems: TrackableMap<string, LockedModem>;
import "./evtLogger";
import "./main.ami";
import "./main.bridge";
