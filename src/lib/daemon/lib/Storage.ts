import * as storage from "node-persist";
import * as path from "path";
import { Message } from "../../../../../ts-gsm-modem/dist/lib/index";
import { JSON_parse_WithDate } from "../../client/AmiClient";

export interface StorageData {
    pins: {
        [iccidOrImei: string]: string;
    };
    messages: {
        [imsi: string]: Message[];
    }
}

export namespace Storage {

    export async function read(): Promise<StorageData> {
        return await storage.getItem("storageData") || storageDataDefault;
    }

    export async function write(storageData: StorageData): Promise<void> {
        await storage.setItem("storageData", storageData);
    }

}


storage.initSync({
    "dir": path.join(__dirname, "..", "..", "..", "..", ".node-persist", "storage"),
    "parse": JSON_parse_WithDate
});


const storageDataDefault: StorageData = {
    pins: {},
    messages: {}
};
