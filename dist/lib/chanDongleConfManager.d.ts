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
        audio: string;
        data: string;
    } | any;
};
export declare namespace chanDongleConfManager {
    function getConfig(): ModuleConfiguration;
    const reset: () => Promise<void>;
    const addDongle: ({dongleName, data, audio}: DongleConf) => Promise<void>;
    const removeDongle: (dongleName: string) => Promise<void>;
}
export declare function reloadChanDongle(): Promise<void>;
