
import { Ami } from "ts-ami";
import * as path from "path";
import * as fs from "fs";
import * as scriptLib from "scripting-tools";

export namespace AmiCredential {

    export let dir_path= ".";

    export const file_name = "asterisk_ami_credentials.json";

    export function set(credential: Ami.Credential, unix_user: string): void {

        const file_path= path.join(dir_path, file_name);

        //TODO this file should be readonly for user
        fs.writeFileSync(
            file_path,
            Buffer.from(JSON.stringify(credential, null, 2), "utf8")
        );

        scriptLib.execSync(`chmod 640 ${file_path}`);

        scriptLib.execSync(`chown ${unix_user}:${unix_user} ${file_path}`);

    }

    export function get(): Ami.Credential {
        return JSON.parse(
            fs.readFileSync(
                path.join(dir_path, file_name)
            ).toString("utf8")
        );
    }

}



