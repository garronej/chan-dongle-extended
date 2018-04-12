export declare function colorize(str: string, color: "GREEN" | "RED" | "YELLOW"): string;
export declare function showLoad(message: string): {
    onError(errorMessage: string): void;
    onSuccess(message?: string): void;
};
export declare namespace showLoad {
    function exec(cmd: string, onError: (errorMessage: string) => void): Promise<string>;
}
export declare function apt_get_install(package_name: string, prog?: string): Promise<void>;
export declare namespace apt_get_install {
    let onError: (error: Error) => never;
    let isFirst: boolean;
    function isPkgInstalled(package_name: string): boolean;
    function doesHaveProg(prog: string): boolean;
}
