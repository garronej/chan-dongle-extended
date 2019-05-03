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
export declare namespace tty0tty {
    const ko_file_path = "/lib/modules/$(uname -r)/kernel/drivers/misc/tty0tty.ko";
    function install(): Promise<void>;
    function remove(): void;
    function re_install_if_needed(): Promise<void>;
}
export declare function build_ast_cmdline(): string;
export declare namespace build_ast_cmdline {
    function build_from_args(ld_library_path_for_asterisk: string, asterisk_main_conf: string): string;
}
export declare function rebuild_node_modules_if_needed(): Promise<void>;
