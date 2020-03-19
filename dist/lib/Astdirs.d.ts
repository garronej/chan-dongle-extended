export declare type Astdirs = typeof Astdirs.phony;
export declare namespace Astdirs {
    const phony: {
        astetcdir: string;
        astmoddir: string;
        astvarlibdir: string;
        astdbdir: string;
        astkeydir: string;
        astdatadir: string;
        astagidir: string;
        astspooldir: string;
        astrundir: string;
        astlogdir: string;
        astsbindir: string;
    };
    function set(asterisk_main_config_file_path: string): void;
    function getStatic(asterisk_main_config_file_path: string): Astdirs;
    function get(): Astdirs;
}
