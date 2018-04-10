export declare function apt_get_install(package_name: string, prog?: string): void;
export declare namespace apt_get_install {
    let isFirst: boolean;
    function isPkgInstalled(package_name: string): boolean;
    function doesHaveProg(prog: string): boolean;
}
