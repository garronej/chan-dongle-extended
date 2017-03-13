import * as AstMan from "asterisk-manager";
import { writeFile, readFileSync } from "fs";
import { execStack, ExecStack } from "ts-exec-stack";
import { ini } from "../../tools/iniExt";
import { AmiCredential } from "../../shared/AmiCredential";

import * as _debug from "debug";
let debug= _debug("_ChanDongleConfManager");


const { port, host, user, secret } = AmiCredential.retrieve();
const path = "/etc/asterisk/dongle.conf";

let config;

try {

    config = ini.parseStripWhitespace(readFileSync(path, "utf8"))

    config.defaults.disablesms = "yes";

    for (let key of Object.keys(config)) {

        if (key === "general" || key === "defaults")
            continue;

        delete config[key];

    }

} catch (error) {

    config = {
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

}




export interface DongleConf {
    id: string;
    atInterface: string;
    audioInterface: string;
}

export class ChanDongleConfManager {

    private constructor() { }

    public static addDongle = execStack("WRITE",
        (dongleConf: DongleConf, callback?: () => void): void => {

            config[dongleConf.id] = {
                "audio": dongleConf.audioInterface,
                "data": dongleConf.atInterface
            };

            update(callback!);

        });

    public static removeDongle = execStack("WRITE",
        (dongleId: string, callback?: () => void): void => {

            delete config[dongleId];

            update(callback!);

        });

}

ChanDongleConfManager.removeDongle("");

function update(callback: () => void): void {

    writeFile(path, ini.stringify(config), {
        "encoding": "utf8",
        "flag": "w"
    }, error => {

        if (error) throw error;

        reloadChanDongle(callback);

    });

}

function reloadChanDongle(callback: () => void): void {

    let ami = new AstMan(port, host, user, secret, true);

    ami.once("close", hasError => {
        if( hasError ) setTimeout(()=> reloadChanDongle(callback), 15000);
    });

    ami.once("connect", () => {

        let actionId = ami.action({
            "action": "DongleReload",
            "When": "when convenient"
        }, (error, res) => {

            if (error) throw error;

            ami.disconnect();

            callback();

        });


    });

}