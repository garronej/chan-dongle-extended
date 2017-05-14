import { ExecQueue } from "ts-exec-queue";
export interface DongleConf {
    dongleName: string;
    data: string;
    audio: string;
}
export declare const defaultConfig: {
    "general": {
        "interval": string;
        "jbenable": string;
        "jbmaxsize": string;
        "jbimpl": string;
    };
    "defaults": {
        "context": string;
        "group": string;
        "rxgain": string;
        "txgain": string;
        "autodeletesms": string;
        "resetdongle": string;
        "u2diag": string;
        "usecallingpres": string;
        "callingpres": string;
        "disablesms": string;
        "language": string;
        "smsaspdu": string;
        "mindtmfgap": string;
        "mindtmfduration": string;
        "mindtmfinterval": string;
        "callwaiting": string;
        "disable": string;
        "initstate": string;
        "exten": string;
        "dtmf": string;
    };
};
export declare type ModuleConfiguration = {
    general: typeof defaultConfig['general'];
    defaults: typeof defaultConfig['defaults'];
    [dongleName: string]: {
        audio?: string;
        data?: string;
        rxgain?: string;
        txgain?: string;
    };
};
export declare namespace ChanDongleConfManager {
    function getConfig(): ModuleConfiguration;
    const reset: ((callback?: (() => void) | undefined) => Promise<void>) & ExecQueue;
    const addDongle: (({dongleName, data, audio}: DongleConf, callback?: (() => void) | undefined) => Promise<void>) & ExecQueue;
    const removeDongle: ((dongleName: string, callback?: (() => void) | undefined) => Promise<void>) & ExecQueue;
}
export declare function reloadChanDongle(): Promise<void>;
