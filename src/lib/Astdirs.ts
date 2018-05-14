import * as path from "path";
import * as fs from "fs";

export type Astdirs = typeof Astdirs.phony;

export namespace Astdirs {

    export let dir_path= ".";

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

    const file_name= "astdirs.json"

    let instance: Astdirs | undefined= undefined;

    export function set(asterisk_main_config_file_path: string): void{

        let raw = fs.readFileSync(asterisk_main_config_file_path).toString("utf8");

        let astdirs: Astdirs= {...Astdirs.phony };

        for (let key in Astdirs.phony ) {

            astdirs[key] = raw.match(new RegExp(`^${key}[^\/]+(\/[^\\s]+)\s*$`, "m"))![1];

        }

        fs.writeFileSync(
            path.join(dir_path, file_name),
            Buffer.from(JSON.stringify(astdirs, null, 2), "utf8")
        );

        instance= astdirs;

    }

    export function get(): Astdirs {

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
