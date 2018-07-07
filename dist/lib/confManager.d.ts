import { types as dcTypes } from "../chan-dongle-extended-client";
import { Ami } from "ts-ami";
export declare type DongleConf = {
    dongleName: string;
    data: string;
    audio: string;
};
export declare type Api = {
    staticModuleConfiguration: dcTypes.StaticModuleConfiguration;
    reset(): Promise<void>;
    addDongle(dongleConf: DongleConf): Promise<void>;
    removeDongle(dongleName: string): Promise<void>;
};
export declare function beforeExit(): Promise<void>;
export declare namespace beforeExit {
    let impl: () => Promise<void>;
}
export declare function getApi(ami: Ami): Promise<Api>;
