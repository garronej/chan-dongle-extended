import { Ami } from "ts-ami";
export declare namespace AmiCredential {
    const file_path: string;
    function set(credential: Ami.Credential): void;
    function get(): Ami.Credential;
}
