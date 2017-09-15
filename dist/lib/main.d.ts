import { Modem, UnlockCodeProviderCallback, AtMessage } from "ts-gsm-modem";
import { AccessPoint } from "gsm-modem-connection";
import { VoidSyncEvent } from "ts-events-extended";
import { TrackableMap } from "trackable-map";
export declare function getDongleName(accessPoint: AccessPoint): string;
export interface LockedModem {
    imei: string;
    iccid: string;
    pinState: AtMessage.LockedPinState;
    tryLeft: number;
    callback: UnlockCodeProviderCallback;
    evtDisconnect: VoidSyncEvent;
}
export declare const lockedModems: TrackableMap<AccessPoint, LockedModem>;
export declare const activeModems: TrackableMap<AccessPoint, Modem>;
import "./evtLogger";
import "./main.ami";
import "./main.bridge";
