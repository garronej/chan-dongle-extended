export declare type InstallOptions = typeof InstallOptions.defaults;
export declare namespace InstallOptions {
    const file_path: string;
    const defaults: {
        "asterisk_main_conf": string;
        "bind_addr": string;
        "port": number;
        "disable_sms_dialplan": boolean;
        "ast_include_dir_path": string;
        "enable_ast_ami_on_port": number;
        "assume_chan_dongle_installed": boolean;
        "ld_library_path_for_asterisk": string;
    };
    function set(options: Partial<InstallOptions>): void;
    function get(): InstallOptions;
    function getDeduced(): {
        assume_asterisk_installed: boolean;
        overwrite_ami_port_if_enabled: boolean;
    };
}
