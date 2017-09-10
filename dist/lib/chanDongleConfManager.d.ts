import { typesDef } from "../_chan-dongle-extended-client";
import ModuleConfiguration = typesDef.ModuleConfiguration;
export interface DongleConf {
    dongleName: string;
    data: string;
    audio: string;
}
export declare namespace chanDongleConfManager {
    function getConfig(): ModuleConfiguration;
    const reset: () => Promise<void>;
    const addDongle: ({dongleName, data, audio}: DongleConf) => Promise<void>;
    const removeDongle: (dongleName: string) => Promise<void>;
}
export declare function reloadChanDongle(): Promise<void>;
