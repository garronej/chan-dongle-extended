import { Modem, UnlockCodeProviderCallback, AtMessage } from "../../../../ts-gsm-modem/dist/lib/index";
import { AccessPoint } from "gsm-modem-connection";
import { TrackableMap } from "trackable-map";
export declare const activeModems: TrackableMap<string, {
    modem: Modem;
    accessPoint: AccessPoint;
}>;
export declare const lockedModems: TrackableMap<string, {
    iccid: string;
    pinState: AtMessage.LockedPinState;
    tryLeft: number;
    callback: UnlockCodeProviderCallback;
}>;
import "./main.ami";
import "./main.bridge";
