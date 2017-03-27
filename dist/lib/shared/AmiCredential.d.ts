export interface Credential {
    port: number;
    host: string;
    user: string;
    secret: string;
}
export declare namespace AmiCredential {
    function retrieve(): Credential;
}
