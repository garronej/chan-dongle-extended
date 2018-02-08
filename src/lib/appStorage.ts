import * as runExclusive from "run-exclusive";
import * as superJson from "super-json";
import * as storage from "node-persist";
import * as path from "path";
import { Message } from "ts-gsm-modem";

namespace JSON {
    const myJson = superJson.create({
        "magic": '#!',
        "serializers": [superJson.dateSerializer]
    });

    export function stringify(obj: any): string {
        return myJson.stringify(obj);
    }

    export function parse(str: string): any {
        return myJson.parse(str);
    }

}

export type AppData = {
    pins: {
        [iccidOrImei: string]: string;
    };
    messages: { [imsi: string]: Message[] };
}

const defaultStorageData: AppData = {
    "pins": {},
    "messages": {}
};

let init = false;

const read_ = runExclusive.build(
    async (callback: (appData: AppData) => void) => {

        if (!init) {

            await storage.init({
                "dir": path.join(__dirname, "..", "..", ".node-persist", "storage"),
                "parse": JSON.parse,
                "stringify": JSON.stringify
            });

            init = true;

        }

        let appData: AppData = (await storage.getItem("appData")) || defaultStorageData;

        callback(appData);

        await Promise.resolve();

        limitSize(appData);

        await storage.setItem("appData", appData);

    }
);

function limitSize(appData: AppData) {

    for( let imsi in appData.messages ){

            appData.messages[imsi]= appData.messages[imsi].splice(-1000);

    }

}

export function read(): Promise<AppData> {
    return new Promise<any>(resolve => read_(resolve));
}
