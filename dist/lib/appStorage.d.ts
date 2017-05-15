import { Message } from "chan-dongle-extended-client";
export declare const JSON_parse_WithDate: (str: string) => any;
export declare type AppData = {
    pins: {
        [iccidOrImei: string]: string;
    };
    messages: {
        [imsi: string]: Message[];
    };
};
export declare type ReadOutput = AppData & {
    readonly release: () => Promise<void>;
};
export declare namespace appStorage {
    function read(): Promise<ReadOutput>;
}
