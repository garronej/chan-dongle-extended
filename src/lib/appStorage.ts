import * as runExclusive from "run-exclusive";
import { Message } from "ts-gsm-modem";
import * as tt from "transfer-tools";
import * as storage from "node-persist";

const JSON_CUSTOM= tt.JSON_CUSTOM.get();

export type AppData = {
    pins: {
        [iccidOrImei: string]: string;
    };
    messages: { [imsi: string]: Message[] };
};

const defaultStorageData: AppData = {
    "pins": {},
    "messages": {}
};

let init = false;

const read_ = runExclusive.build(
    async (callback: (appData: AppData) => void) => {

        if (!init) {

            await storage.init({
                "dir": "./app",
                "parse": JSON_CUSTOM.parse,
                "stringify": JSON_CUSTOM.stringify
            });

            init = true;

        }

        let appData: AppData = (await storage.getItem("appData")) || defaultStorageData;

        callback(appData);

        await new Promise<void>(resolve=> setTimeout(()=> resolve(), 0));

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
