#!/usr/bin/env node
export declare const working_directory_path: string;
export declare const db_path: string;
export declare function getIsProd(): boolean;
export declare namespace getIsProd {
    let value: boolean | undefined;
}
export declare namespace asterisk_manager {
    function enable(): void;
    function restore(): void;
}
