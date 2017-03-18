import * as storage from "node-persist";
import * as path from "path";
import { Message } from "../../../../../ts-gsm-modem/out/lib/index";

export interface StorageData {
    pins: {
        [iccidOrImei: string]: string;
    };
    messages: {
        [imei: string]: Message[];
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
    "parse": (str: string) => JSON.parse(
        str,
        (_, value) =>
            (
                typeof value === "string" &&
                value.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
            ) ? new Date(value) : value
    )
});


const storageDataDefault: StorageData = {
    pins: {},
    messages: {}
};
