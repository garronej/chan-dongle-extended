import { writeFile, readFileSync } from "fs";
import { ini } from "ini-extended";
import { execQueue, ExecQueue } from "ts-exec-queue";
import { DongleExtendedClient } from "chan-dongle-extended-client";
import * as path from "path";

const astConfPath= path.join("/etc", "asterisk");
const dongleConfPath= path.join(astConfPath, "dongle.conf");

import * as _debug from "debug";
let debug = _debug("_ChanDongleConfManager");


export interface DongleConf {
    dongleName: string;
    data: string;
    audio: string;
}


export const defaultConfig = {
    "general": {
        "interval": "10000000",
        "jbenable": "yes",
        "jbmaxsize": "100",
        "jbimpl": "fixed"
    },
    "defaults": {
        "context": "from-dongle",
        "group": "0",
        "rxgain": "0",
        "txgain": "0",
        "autodeletesms": "no",
        "resetdongle": "yes",
        "u2diag": "-1",
        "usecallingpres": "yes",
        "callingpres": "allowed_passed_screen",
        "disablesms": "no",
        "language": "en",
        "smsaspdu": "yes",
        "mindtmfgap": "45",
        "mindtmfduration": "80",
        "mindtmfinterval": "200",
        "callwaiting": "auto",
        "disable": "no",
        "initstate": "start",
        "exten": "+12345678987",
        "dtmf": "relax"
    }
};



export type ModuleConfiguration={
    general: typeof defaultConfig['general'],
    defaults: typeof defaultConfig['defaults'],
    [dongleName: string]: {
        audio?: string;
        data?: string;
    };
};


let config: ModuleConfiguration | undefined = undefined;

export namespace ChanDongleConfManager {

    const cluster = {};

    export function getConfig(): ModuleConfiguration {

        if (!config) config = loadConfig();

        return config;

    }

    export const reset = execQueue(cluster, "WRITE",
        async (callback?: () => void) => {

            if (!config) config = loadConfig();

            await update();

            callback!();

        }
    );


    export const addDongle = execQueue(cluster, "WRITE",
        async ({ dongleName, data, audio }: DongleConf, callback?: () => void) => {

            if (!config) config = loadConfig();

            config[dongleName] = {
                "audio": audio,
                "data": data
            };

            await update();

            callback!();

        }
    );

    export const removeDongle = execQueue(cluster, "WRITE",
        async (dongleName: string, callback?: () => void) => {

            if (!config) config = loadConfig();

            delete config[dongleName];

            await update();

            callback!();

        }
    );


}


function update(): Promise<void> {

    return new Promise<void>(
        resolve => writeFile(
            dongleConfPath,
            ini.stringify(config),
            { "encoding": "utf8", "flag": "w" },
            async error => {

                if (error) throw error;

                await reloadChanDongle();

                resolve();

            }
        )
    );

}


export async function reloadChanDongle() {

    await DongleExtendedClient.localhost().ami.postAction({
        "action": "DongleReload",
        "when": "gracefully"
    });

    debug("update chan_dongle config");

}



function loadConfig(): ModuleConfiguration {

    try {

        let { general, defaults } = ini.parseStripWhitespace(
            readFileSync(dongleConfPath, "utf8")
        );

        defaults.autodeletesms = "false";
        defaults.disablesms= "no";
        general.interval = "10000";

        return { general, defaults };

    } catch (error) {

        return defaultConfig;

    }
}