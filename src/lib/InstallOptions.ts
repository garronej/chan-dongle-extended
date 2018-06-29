
import * as path from "path";
import * as fs from "fs";
import { misc as dcMisc } from "../chan-dongle-extended-client";
import { working_directory_path } from "../bin/installer";

export type InstallOptions = typeof InstallOptions.defaults;

export namespace InstallOptions {

    export const file_path = path.join(working_directory_path,"install_options.json");

    export const defaults = {
        "asterisk_main_conf": "/etc/asterisk/asterisk.conf",
        "bind_addr": "127.0.0.1",
        "port": dcMisc.port,
        "disable_sms_dialplan": false,
        "ast_include_dir_path": "/usr/include",
        "enable_ast_ami_on_port": 5038,
        "assume_chan_dongle_installed": false,
        "ld_library_path_for_asterisk": ""
    };

    let _options: Partial<InstallOptions> | undefined = undefined;

    export function set(options: Partial<InstallOptions>): void {

        _options = {};

        for (let key in defaults) {
            _options[key] = options[key];
        }

        fs.writeFileSync(
            file_path,
            Buffer.from(JSON.stringify(_options, null, 2), "utf8")
        );

    }

    export function get(): InstallOptions {

        if (!_options) {

            _options = require(file_path) as Partial<InstallOptions>;

        }

        const installOptions: InstallOptions = { ...InstallOptions.defaults };

        for (let key in InstallOptions.defaults) {

            if (_options[key] !== undefined) {
                installOptions[key] = _options[key];
            }

        }

        return installOptions;

    }

    export function getDeduced(): {
        assume_asterisk_installed: boolean;
        overwrite_ami_port_if_enabled: boolean;
    } {

        get();

        const o = _options!;

        return {
            "assume_asterisk_installed": !!o.ast_include_dir_path || !!o.asterisk_main_conf || !!o.ld_library_path_for_asterisk,
            "overwrite_ami_port_if_enabled": o.enable_ast_ami_on_port !== undefined
        };

    }

}



