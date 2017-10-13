import { DongleController as Dc } from "chan-dongle-extended-client";
export declare type AppData = {
    pins: {
        [iccidOrImei: string]: string;
    };
    messages: Dc.Messages;
};
export declare function read(): Promise<AppData>;
