export declare type Astdirs = typeof Astdirs.phony;
export declare namespace Astdirs {
    let dir_path: string;
    const phony: {
        "astetcdir": string;
        "astmoddir": string;
        "astvarlibdir": string;
        "astdbdir": string;
        "astkeydir": string;
        "astdatadir": string;
        "astagidir": string;
        "astspooldir": string;
        "astrundir": string;
        "astlogdir": string;
        "astsbindir": string;
    };
    function set(asterisk_main_config_file_path: string): void;
    function get(): Astdirs;
}
