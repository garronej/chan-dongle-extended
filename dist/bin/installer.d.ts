export declare const unix_user_default = "chan_dongle";
export declare const srv_name = "chan_dongle";
export declare const working_directory_path: string;
export declare const node_path: string;
export declare const pidfile_path: string;
export declare const db_path: string;
export declare function getIsProd(): boolean;
export declare namespace getIsProd {
    let value: boolean | undefined;
}
export declare function build_ast_cmdline(): string;
export declare namespace build_ast_cmdline {
    function build_from_args(ld_library_path_for_asterisk: string, asterisk_main_conf: string): string;
}
