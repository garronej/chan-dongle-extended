import * as fs from "fs";
import { ini } from "ini-extended";
import * as runExclusive from "run-exclusive";
import * as path from "path";
import { Astdirs } from "./Astdirs";
import { types as dcTypes } from "../chan-dongle-extended-client";
import { Ami } from "ts-ami";
import * as logger from "logger";

const debug= logger.debugFactory();

export type DongleConf= {
    dongleName: string;
    data: string;
    audio: string;
}

export type Api = {
    staticModuleConfiguration: dcTypes.StaticModuleConfiguration;
    reset(): Promise<void>;
    addDongle(dongleConf: DongleConf): Promise<void>;
    removeDongle(dongleName: string): Promise<void>;
};

const default_staticModuleConfiguration: dcTypes.StaticModuleConfiguration = {
    "general": {
        "interval": "10000000",
        "jbenable": "no"
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

async function loadChanDongleSo(ami: Ami): Promise<void> {

    debug("Checking if chan_dongle.so is loaded...");

    try {

        let { response } = await ami.postAction("ModuleCheck", {
            "module": "chan_dongle.so"
        });

        if (response !== "Success") {

            throw new Error("not loaded");

        }

    } catch{

        debug("chan_dongle.so is not loaded, loading manually");

        await ami.postAction("ModuleLoad", {
            "module": "chan_dongle.so",
            "loadtype": "load"
        });

    }

    debug("chan_dongle.so is loaded!");

}

export async function getApi(ami: Ami): Promise<Api> {

    await loadChanDongleSo(ami);

    ami.evt.attach(
        ({ event })=> event === "FullyBooted", 
        ()=> loadChanDongleSo(ami)
    );

    let dongle_conf_path = path.join(Astdirs.get().astetcdir, "dongle.conf");

    const staticModuleConfiguration: dcTypes.StaticModuleConfiguration = (() => {

        try {

            let { general, defaults } = ini.parseStripWhitespace(
                fs.readFileSync(dongle_conf_path).toString("utf8")
            );

            console.assert(!!general && !!defaults);

            defaults.autodeletesms = default_staticModuleConfiguration.defaults["autodeletesms"];
            general.interval = default_staticModuleConfiguration.general["interval"];

            for (let key in defaults) {

                if (!defaults[key]) {
                    defaults[key] = default_staticModuleConfiguration.defaults[key];
                }

            }

            return { general, defaults };

        } catch  {

            return default_staticModuleConfiguration;

        }

    })();

    const state = { ...staticModuleConfiguration };

    const update = (): Promise<void> => new Promise<void>(
        resolve => fs.writeFile(
            dongle_conf_path,
            Buffer.from(ini.stringify(state), "utf8"),
            async error => {

                if (error) {
                    throw error;
                }

                resolve();

                ami.postAction("DongleReload", { "when": "gracefully" })
                    .catch(() => debug("Dongle reload fail, is asterisk running?"))
                    ;

            }
        )
    );

    const groupRef = runExclusive.createGroupRef();

    const api: Api = {
        staticModuleConfiguration,
        "reset": runExclusive.build(groupRef,
            async () => {

                debug("reset");

                for (let key of Object.keys(state).filter(key => key !== "general" && key !== "defaults")) {

                    delete state[key];

                }

                await update();

            }
        ),
        "addDongle": runExclusive.build(groupRef,
            async ({ dongleName, data, audio }: DongleConf) => {

                debug("addDongle", { dongleName, data, audio });

                state[dongleName] = { audio, data };

                await update();

            }
        ),
        "removeDongle": runExclusive.build(groupRef,
            async (dongleName: string) => {

                debug("removeDongle", { dongleName });

                delete state[dongleName];

                await update();

            }
        )

    };

    api.reset();

    return api;

}





