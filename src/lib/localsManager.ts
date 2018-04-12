
import * as path from "path";
import * as fs from "fs";
import { misc as dcMisc } from "../chan-dongle-extended-client";

export type Locals = typeof Locals.defaults;

export namespace Locals {

    export const defaults = {
        "service_name": "dongle",
        "astetcdir": "/etc/asterisk",
        "bind_addr": "127.0.0.1",
        "port": dcMisc.port,
        "ami_port": 5038,
        "disable_sms_dialplan": false,
        "build_across_linux_kernel": null as any as string,
        "ast_include_dir_path": "/usr/include/",
        "assume_chan_dongle_installed": false
    };

}

export type Astdirs = typeof Astdirs.phony;

export namespace Astdirs {

    export const phony = {
        "astetcdir": "",
        "astmoddir": "",
        "astvarlibdir": "",
        "astdbdir": "",
        "astkeydir": "",
        "astdatadir": "",
        "astagidir": "",
        "astspooldir": "",
        "astrundir": "",
        "astlogdir": "",
        "astsbindir": ""
    };

}


export const file_name= "locals.json";

export function get(dir_path= "."): { locals: Locals, astdirs: Astdirs; } {

    if (!!get.instance) {
        return get.instance;
    }

    let locals: Locals = JSON.parse(
        fs.readFileSync(
            path.join(dir_path,file_name)
        ).toString("utf8")
    );

    let astdirs= get.readAstdirs(locals.astetcdir);

    return get.instance= { locals, astdirs };

}

export namespace get {

    export let instance: ({ locals: Locals, astdirs: Astdirs }) | undefined = undefined;

    export function readAstdirs(astetcdir: string) {

        let text = fs.readFileSync(
            path.join(astetcdir, "asterisk.conf")
        ).toString("utf8");

        let astdirs: Astdirs= {...Astdirs.phony };

        for (let key in Astdirs.phony ) {

            astdirs[key] = text.match(new RegExp(`^${key}[^\/]+(\/[^\\s]+)\s*$`, "m"))![1];

        }

        return astdirs;

    }

}
