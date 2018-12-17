import * as path from "path";
import * as fs from "fs";
import { working_directory_path } from "../bin/installer";

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

    const file_path= path.join(working_directory_path, "astdirs.json");

    let instance: Astdirs | undefined= undefined;

    export function set(asterisk_main_config_file_path: string): void{

        const astdirs=getStatic(asterisk_main_config_file_path);

        fs.writeFileSync(
            file_path,
            Buffer.from(JSON.stringify(astdirs, null, 2), "utf8")
        );

        instance= astdirs;

    }

    export function getStatic(asterisk_main_config_file_path: string): Astdirs {

        const raw = fs.readFileSync(asterisk_main_config_file_path).toString("utf8");

        const astdirs: Astdirs= {...Astdirs.phony };

        for (let key in Astdirs.phony ) {

            astdirs[key] = raw.match(new RegExp(`^${key}[^\/]+(\/[^\\s]+)\s*$`, "m"))![1];

        }

        return astdirs;

    }

    export function get(): Astdirs {

        if (!!instance) {
            return instance;
        }

        instance = require(file_path);

        return get();

    }

}
