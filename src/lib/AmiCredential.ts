
import { Ami } from "ts-ami";
import * as path from "path";
import * as fs from "fs";
import * as scriptLib from "scripting-tools";
import { working_directory_path } from "../bin/installer";
import { InstallOptions } from "./InstallOptions";

export namespace AmiCredential {

    export const file_path = path.join(working_directory_path,"asterisk_ami_credentials.json");

    export function set(credential: Ami.Credential): void {

        fs.writeFileSync(
            file_path,
            Buffer.from(JSON.stringify(credential, null, 2), "utf8")
        );

        scriptLib.execSync(`chmod 640 ${file_path}`);

        const unix_user= InstallOptions.get().unix_user;

        scriptLib.execSync(`chown ${unix_user}:${unix_user} ${file_path}`);

    }


    export function get(): Ami.Credential {
        return require(file_path);
    }

}



