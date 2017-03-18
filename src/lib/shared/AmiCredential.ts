import { ini } from "../tools/iniExt";
import { readFileSync } from "fs";
require("colors");

const confPath = "/etc/asterisk/manager.conf";

export interface Credential {
    port: number;
    host: string;
    user: string;
    secret: string;
};

export namespace AmiCredential {

    export function retrieve(): Credential {

        if (credential) return credential;

        return credential = init();

    }


}

let credential: Credential | undefined = undefined;

function init(): Credential {

    let config = ini.parseStripWhitespace(readFileSync(confPath, "utf8"))

    let general: {
        enabled?: "yes" | "no";
        port?: string;
        bindaddr?: string;
    } = config.general || {};

    if (general.enabled !== "yes")
        throw new Error("Asterisk manager is not enabled");

    let port: number = general.port ? parseInt(general.port) : 5038;
    let host: string =
        (general.bindaddr && general.bindaddr !== "0.0.0.0") ? general.bindaddr : "127.0.0.1";

    delete config.general;

    let credential: {
        user: string;
        secret: string
    } | undefined = undefined;

    for (let userName of Object.keys(config)) {

        let userConfig: {
            secret?: string;
            read?: string;
            write?: string;
        } = config[userName];

        if (
            !userConfig.secret ||
            !userConfig.write ||
            !userConfig.read
        ) continue;

        if (
            isGranted(getListAuthority(userConfig.read!)) &&
            isGranted(getListAuthority(userConfig.write!))
        ) {

            credential = { "user": userName, "secret": userConfig.secret };
            break;

        }

    }

    return { ...credential, port, host };

}



function getListAuthority(strList: string): string[] {

    strList = strList.replace(/\ /g, "");

    return strList.split(",");

}

function isGranted(list: string[]): boolean {

    let hasUser = false;
    let hasSystem = false;
    let hasConfig = false;

    for (let authority of list) {

        if (authority.toLowerCase() === "all")
            return true;

        if (authority.toLocaleLowerCase() === "user")
            hasUser = true;

        if (authority.toLocaleLowerCase() === "system")
            hasSystem = true;

        if (authority.toLocaleLowerCase() === "config")
            hasConfig = true;

    }

    return hasUser && (hasSystem || hasConfig);

}
