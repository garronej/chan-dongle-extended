import { Message } from "ts-gsm-modem";
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
export declare function read(): Promise<ReadOutput>;
