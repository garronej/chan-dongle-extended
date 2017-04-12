import { Modem, UnlockCodeProviderCallback } from "ts-gsm-modem";
import { AccessPoint } from "gsm-modem-connection";
import { TrackableMap } from "trackable-map";
export declare const activeModems: TrackableMap<string, {
    modem: Modem;
    accessPoint: AccessPoint;
    chanDongleDeviceName: string;
}>;
export declare const lockedModems: TrackableMap<string, {
    iccid: string;
    pinState: "SIM PIN" | "SIM PUK" | "SIM PIN2" | "SIM PUK2";
    tryLeft: number;
    callback: UnlockCodeProviderCallback;
}>;
import "./main.ami";
import "./main.bridge";
