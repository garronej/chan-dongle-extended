import * as runExclusive from "run-exclusive";
import * as superJson from "super-json";
import * as storage from "node-persist";
import * as path from "path";
import { DongleController as Dc } from "../chan-dongle-extended-client";
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
    messages: Dc.Messages;
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

    const maxNumberOfMessages = 1300;
    const reduceTo = 1000;

    for (let imei of Object.keys(appData.messages)) {

        for (let iccid of Object.keys(appData.messages[imei])) {

            let messages = appData.messages[imei][iccid];

            if (messages.length <= maxNumberOfMessages) continue;

            let sortedMessages = messages.sort(
                (i, j) => i.date.getTime() - j.date.getTime()
            );

            messages = [];

            for (let i = sortedMessages.length - reduceTo; i < sortedMessages.length; i++)
                messages.push(sortedMessages[i]);

            appData.messages[imei][iccid] = messages;

        }

    }

}

export function read(): Promise<AppData> {
    return new Promise<any>(resolve => read_(resolve));
}
