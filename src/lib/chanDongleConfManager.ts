import { writeFile, readFileSync } from "fs";
import { ini } from "ini-extended";
import * as runExclusive from "run-exclusive";
import * as path from "path";

import { _private, DongleController as Dc, Ami } from "../chan-dongle-extended-client";
import defaultConfig= _private.defaultConfig;
import ModuleConfiguration= Dc.ModuleConfiguration;

export interface DynamicModuleConfiguration extends ModuleConfiguration {
    [dongleName: string]: {
        audio: string;
        data: string;
    } | any;
}

const astConfPath = path.join("/etc", "asterisk");
const dongleConfPath = path.join(astConfPath, "dongle.conf");

import * as _debug from "debug";
let debug = _debug("_ChanDongleConfManager");


export interface DongleConf {
    dongleName: string;
    data: string;
    audio: string;
}


let config: DynamicModuleConfiguration | undefined = undefined;

export namespace chanDongleConfManager {

    const groupRef = runExclusive.createGroupRef();

    export function getConfig(): DynamicModuleConfiguration {

        if (!config) config = loadConfig();

        return config;

    }

    export const reset = runExclusive.build(groupRef,
        async () => {

            if (!config) config = loadConfig();

            await update();

        }
    );


    export const addDongle = runExclusive.build(groupRef,
        async ({ dongleName, data, audio }: DongleConf) => {

            if (!config) config = loadConfig();

            config[dongleName] = { audio, data };

            await update();

        }
    );

    export const removeDongle = runExclusive.build(groupRef,
        async (dongleName: string) => {

            if (!config) config = loadConfig();

            delete config[dongleName];

            await update();

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

    await Ami.getInstance().postAction(
        "DongleReload",
        { "when": "gracefully" }
    );

    debug("update chan_dongle config");

}



function loadConfig(): DynamicModuleConfiguration {

    try {

        let { general, defaults } = ini.parseStripWhitespace(
            readFileSync(dongleConfPath, "utf8")
        );

        defaults.autodeletesms = "false";
        defaults.disablesms = "no";
        general.interval = "10000";

        return { general, defaults };

    } catch (error) {

        return defaultConfig;

    }
}