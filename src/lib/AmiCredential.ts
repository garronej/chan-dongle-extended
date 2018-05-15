
import { Ami } from "ts-ami";
import * as path from "path";
import * as fs from "fs";

export namespace AmiCredential {

    export let dir_path= ".";

    export const file_name = "asterisk_ami_credentials.json";

    export function set(credential: Ami.Credential): void {

        fs.writeFileSync(
            path.join(dir_path, file_name),
            Buffer.from(JSON.stringify(credential, null, 2), "utf8")
        );

    }

    export function get(): Ami.Credential {
        return JSON.parse(
            fs.readFileSync(
                path.join(dir_path, file_name)
            ).toString("utf8")
        );
    }

}



