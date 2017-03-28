import { writeFile, readFileSync } from "fs";
import { ini } from "ini-extended";
import { execQueue, ExecQueue } from "ts-exec-queue";
import { AmiClient } from "chan-dongle-extended-client";

import * as _debug from "debug";
let debug= _debug("_ChanDongleConfManager");


export interface DongleConf {
    id: string;
    dataIfPath: string;
    audioIfPath: string;
}

export namespace ChanDongleConfManager {

    const cluster = {};

    export const addDongle = execQueue(cluster, "WRITE",
        async ({ id, dataIfPath, audioIfPath }: DongleConf, callback?: () => void): Promise<void> => {

            config[id] = {
                "audio": audioIfPath,
                "data": dataIfPath
            };

            await update();

            callback!();
            return null as any;

        }
    );

    export const removeDongle = execQueue(cluster, "WRITE",
        async (dongleId: string, callback?: () => void): Promise<void> => {

            delete config[dongleId];

            await update();

            callback!();

            return null as any;

        }
    );

}

const path = "/etc/asterisk/dongle.conf";
const defaultConfig = {
    "general": {
        "interval": "1",
        "jbenable": "yes",
        "jbmaxsize": "100",
        "jbimpl": "fixed"
    },
    "defaults": {
        "context": "from-dongle",
        "group": "0",
        "rxgain": "0",
        "txgain": "0",
        "autodeletesms": "yes",
        "resetdongle": "yes",
        "u2diag": "-1",
        "usecallingpres": "yes",
        "callingpres": "allowed_passed_screen",
        "disablesms": "yes",
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

const config = (() => {

    try {

        let out = ini.parseStripWhitespace(readFileSync(path, "utf8"))

        out.defaults.disablesms = "yes";

        for (let key of Object.keys(out)) {

            if (key === "general" || key === "defaults")
                continue;

            delete out[key];

        }

        return out;

    } catch (error) {

        return defaultConfig;

    }

})();


ChanDongleConfManager.removeDongle("");

function update(): Promise<void> {

    return new Promise<void>(
        resolve => writeFile(
            path,
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

async function reloadChanDongle(): Promise<void> {

    await AmiClient.localhost().postAction({
        "action": "DongleReload",
        "when": "gracefully"
    }).promise;

    debug("update chan_dongle config");

}