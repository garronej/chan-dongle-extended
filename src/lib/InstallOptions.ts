
import * as path from "path";
import * as fs from "fs";
import { misc as dcMisc } from "../chan-dongle-extended-client";

export type InstallOptions = typeof InstallOptions.defaults;

export namespace InstallOptions {

    export let dir_path= ".";

    export const file_name = "install_options.json";

    export const defaults = {
        "asterisk_main_conf": "/etc/asterisk/asterisk.conf",
        "bind_addr": "127.0.0.1",
        "port": dcMisc.port,
        "disable_sms_dialplan": false,
        "ast_include_dir_path": "/usr/include",
        "enable_ast_ami_on_port": 5038,
        "assume_asterisk_installed": false,
        "assume_chan_dongle_installed": false
    };

    let instance: InstallOptions | undefined = undefined;

    export function set( options: Partial<InstallOptions> ): void {

        const installOptions: InstallOptions = { ...InstallOptions.defaults };

        for (let key in InstallOptions.defaults) {

            if (options[key] !== undefined) {
                installOptions[key] = options[key];
            }

        }

        fs.writeFileSync(
            path.join(dir_path, file_name),
            Buffer.from(JSON.stringify(installOptions, null, 2), "utf8")
        );

        instance = installOptions;

    }

    export function get(): InstallOptions {

        if (!!instance) {
            return instance;
        }

        instance = JSON.parse(
            fs.readFileSync(
                path.join(dir_path, file_name)
            ).toString("utf8")
        );

        return instance!;

    }

}



