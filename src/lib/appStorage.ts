import * as storage from "node-persist";
import * as path from "path";
import { Message } from "ts-gsm-modem";
import * as runExclusive from "run-exclusive";

export const JSON_parse_WithDate= (str: string) => JSON.parse(
        str,
        (_, value) =>
            (
                typeof value === "string" &&
                value.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
            ) ? new Date(value) : value
);

export type AppData = {
    pins: {
        [iccidOrImei: string]: string;
    };
    messages: {
        [imsi: string]: Message[];
    };
}

const defaultStorageData: AppData = {
    "pins": {},
    "messages": {}
};

export type ReadOutput = AppData & { readonly release: () => Promise<void> };

let init = false;

const queue = runExclusive.buildCb(
    async (provider: (storageData: ReadOutput) => void, callback: () => void) => {

        if (!init) {

            await storage.init({
                "dir": path.join(__dirname, "..", "..", ".node-persist", "storage"),
                "parse": JSON_parse_WithDate
            });

            init = true;

        }

        let appData: AppData = (await storage.getItem("appData")) || defaultStorageData;

        provider({
            ...appData,
            "release": async (): Promise<void> => {
                limitSize(appData);
                await storage.setItem("appData", appData);
                callback();
            }
        });

    }
);

function limitSize(appData: AppData){

    const maxNumberOfMessages= 1300;
    const reduceTo= 1000;

    for( let imsi of Object.keys(appData.messages) ){

        let messages= appData.messages[imsi];

        if( messages.length <= maxNumberOfMessages ) continue;

        let sortedMessages= messages.sort(
            (i, j)=> i.date.getTime() - j.date.getTime()
        );

        messages= [];

        for( let i= sortedMessages.length - reduceTo; i<sortedMessages.length; i++ )
            messages.push(sortedMessages[i]);

        appData.messages[imsi]= messages;

    }

}

export function read(): Promise<ReadOutput> {

    return new Promise<any>(resolve => queue(resolve, () => { }));

}