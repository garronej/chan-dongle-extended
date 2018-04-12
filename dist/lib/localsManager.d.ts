export declare type Locals = typeof Locals.defaults;
export declare namespace Locals {
    const defaults: {
        "service_name": string;
        "astetcdir": string;
        "bind_addr": string;
        "port": number;
        "ami_port": number;
        "disable_sms_dialplan": boolean;
        "build_across_linux_kernel": string;
        "ast_include_dir_path": string;
        "assume_chan_dongle_installed": boolean;
    };
}
export declare type Astdirs = typeof Astdirs.phony;
export declare namespace Astdirs {
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
}
export declare const file_name = "locals.json";
export declare function get(dir_path?: string): {
    locals: Locals;
    astdirs: Astdirs;
};
export declare namespace get {
    let instance: ({
        locals: Locals;
        astdirs: Astdirs;
    }) | undefined;
    function readAstdirs(astetcdir: string): {
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
}
