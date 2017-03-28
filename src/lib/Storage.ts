import * as storage from "node-persist";
import * as path from "path";
import { Message } from "chan-dongle-extended-client";
import { execQueue } from "ts-exec-queue";

export const JSON_parse_WithDate= (str: string) => JSON.parse(
        str,
        (_, value) =>
            (
                typeof value === "string" &&
                value.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
            ) ? new Date(value) : value
);

export type StorageData = {
    pins: {
        [iccidOrImei: string]: string;
    };
    messages: {
        [imsi: string]: Message[];
    };
}

const defaultStorageData: StorageData= {
    "pins": {},
    "messages": {}
};


export namespace Storage {

    const cluster= {};

    const queue = execQueue(cluster, "WRITE",
        (provider: (storageData: StorageData & { readonly release: ()=> Promise<void> }) => void, callback: () => void): void => {

            storage.getItem("storageData", (error, value) => {

                let storageData:StorageData = value || defaultStorageData;

                provider({
                    ...storageData,
                    "release": async (): Promise<void>=> {
                        await storage.setItem("storageData", storageData);
                        callback();
                    }
                });

            });

        }
    );

    export function read(): Promise<StorageData & { readonly release: ()=> Promise<void> }> {

        return new Promise<any>( resolve => queue( resolve, ()=> {}));

    }

}

storage.initSync({
    "dir": path.join(__dirname, "..", "..", ".node-persist", "storage"),
    "parse": JSON_parse_WithDate
});