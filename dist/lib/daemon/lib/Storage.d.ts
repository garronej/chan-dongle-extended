import { Message } from "../../../../../ts-gsm-modem/dist/lib/index";
export interface StorageData {
    pins: {
        [iccidOrImei: string]: string;
    };
    messages: {
        [imsi: string]: Message[];
    };
}
export declare namespace Storage {
    function read(): Promise<StorageData>;
    function write(storageData: StorageData): Promise<void>;
}
