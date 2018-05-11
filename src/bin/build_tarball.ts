#!/usr/bin/env node

require("rejection-tracker").main(__dirname, "..", "..");

import * as scriptLib from "../tools/scriptLib";
import * as child_process from "child_process";
import * as path from "path";
import { module_dir_path } from "./install_prereq";

scriptLib.exit_if_not_root();

export function execSyncInherit(cmd: string, options: any= {}): void {

    console.log(scriptLib.colorize(`$ ${cmd}`, "YELLOW") + "\n");

    child_process.execSync( cmd, { "stdio": "inherit", ...options } );

}

export function find_module_path(
    module_name: string,
    root_module_path: string
): string {

    let cmd= [
        "dirname $(",
        `find ${path.join(root_module_path, "node_modules")} `,
        `-type f -path \\*/node_modules/${module_name}/package.json`,
        ")"
    ].join("");

    let match= child_process
        .execSync(cmd, { "stdio": [] })
        .toString("utf8")
        .split("\n");

    match.pop();

    if( !match.length ){
        throw new Error("Not found");
    }else {
        return match.sort((a,b)=> a.length - b.length)[0];
    }

}

const working_directory_path = path.join(module_dir_path, "working_directory");

if (require.main === module) {

    const dist_dir_name = [
        "dongle",
        `v${require(path.join(module_dir_path, "package.json"))["version"]}`,
        child_process.execSync("uname -m").toString("utf8").replace("\n", "")
    ].join("_");

    console.log({ dist_dir_name });

    const dist_dir_path = path.join(working_directory_path, dist_dir_name);



    (() => {

        const tmp_dir_path = path.join("/tmp", dist_dir_name);

        execSyncInherit(`rm -rf ${tmp_dir_path}`);

        execSyncInherit(`cp -r ${module_dir_path} ${tmp_dir_path}`);

        execSyncInherit(`rm -rf ${dist_dir_path}`);

        execSyncInherit(`mv ${tmp_dir_path} ${dist_dir_path}`);

    })();

    execSyncInherit(`cp ${path.join(working_directory_path, "node")} ${dist_dir_path}`);

    (() => {

        let node_python_messaging_path = find_module_path("node-python-messaging", dist_dir_path);

        execSyncInherit(`rm -r ${path.join(node_python_messaging_path, "dist", "virtual")}`);

    })();

    (() => {

        let udev_module_path = find_module_path("udev", dist_dir_path);

        execSyncInherit(`rm -r ${path.join(udev_module_path, "build")}`);

    })();

    for (let name of [".git", ".gitignore", "src", "tsconfig.json", "pkg-installed.json", "auto_install.sh" ]) {
        execSyncInherit(`rm -rf ${path.join(dist_dir_path, name)}`);
    }

    for (let name of ["@types", "typescript"]) {
        execSyncInherit(`rm -r ${path.join(dist_dir_path, "node_modules", name)}`);
    }

    execSyncInherit(`find ${path.join(dist_dir_path, "node_modules")} -type f -name "*.ts" -exec rm -rf {} \\;`);

    execSyncInherit(`rm -r ${path.join(dist_dir_path, path.basename(working_directory_path))}`);

    execSyncInherit(`tar -czf ${path.join(working_directory_path, `${dist_dir_name}.tar.gz`)} -C ${dist_dir_path} .`);

    execSyncInherit(`rm -r ${dist_dir_path}`);

    console.log("---DONE---");

}

