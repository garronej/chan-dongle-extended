import { Ami } from "ts-ami";
export declare namespace AmiCredential {
    let dir_path: string;
    const file_name = "asterisk_ami_credentials.json";
    function set(credential: Ami.Credential): void;
    function get(): Ami.Credential;
}
