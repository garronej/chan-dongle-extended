import { types } from "../chan-dongle-extended-client";
export interface DynamicModuleConfiguration extends types.ModuleConfiguration {
    [dongleName: string]: {
        audio: string;
        data: string;
    } | any;
}
export interface DongleConf {
    dongleName: string;
    data: string;
    audio: string;
}
export declare namespace chanDongleConfManager {
    function getConfig(): DynamicModuleConfiguration;
    const reset: () => Promise<void>;
    const addDongle: ({ dongleName, data, audio }: DongleConf) => Promise<void>;
    const removeDongle: (dongleName: string) => Promise<void>;
}
export declare function reloadChanDongle(): Promise<void>;
