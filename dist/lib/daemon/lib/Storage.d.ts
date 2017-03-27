import { Message } from "../../../../../ts-gsm-modem/dist/lib/index";
export declare const JSON_parse_WithDate: (str: string) => any;
export declare type StorageData = {
    pins: {
        [iccidOrImei: string]: string;
    };
    messages: {
        [imsi: string]: Message[];
    };
};
export declare namespace Storage {
    function read(): Promise<StorageData & {
        readonly release: () => Promise<void>;
    }>;
}
