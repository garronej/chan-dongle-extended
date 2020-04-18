import { SerialPortExt } from "ts-gsm-modem";
import { Api as ConfManagerApi } from "./confManager";
import * as types from "./types";
export declare function init(modems: types.Modems, chanDongleConfManagerApi: ConfManagerApi): void;
export declare function waitForTerminate(): Promise<void>;
export declare namespace waitForTerminate {
    const ports: Set<SerialPortExt>;
    const evtAllClosed: import("evt").VoidEvt;
}
