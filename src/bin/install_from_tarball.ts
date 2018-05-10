#!/usr/bin/env node

import * as path from "path";
import { module_dir_path, execSyncInherit, find_module_path} from "./build_tarball";
import * as fs from "fs";

const node_path = path.join(module_dir_path, "node");
const bin_dir_path= path.join(module_dir_path, "dist", "bin");

const args= (()=>{

    let out= [ ... process.argv ];

    out.shift();
    out.shift();

    return out.map(v=> `"${v}"`).join(" ");

})();

const runInstaller= 
    () => execSyncInherit(
        `${node_path} ${path.join(bin_dir_path, "installer.js")} install ${args}`
    );

if( !!args.match(/\-\-help/) || !!args.match(/\-h/) ){

    runInstaller();

    process.exit(0);

}

execSyncInherit(`${node_path} ${path.join(bin_dir_path,"install_prereq")}`);

(function build_udev(){

    const udev_dir_path= find_module_path("udev", module_dir_path);

    if (fs.existsSync(path.join(udev_dir_path, "build"))) {
        return;
    }

    let pre_gyp_dir_path: string= "";

    for( let root_module_path of [ udev_dir_path, module_dir_path ]){

        try{ 

            pre_gyp_dir_path = find_module_path("node-pre-gyp", root_module_path);

            break;

        }catch{ }

    }

    execSyncInherit([
        `PATH=${path.join(module_dir_path)}:$PATH`,
        `node ${path.join(pre_gyp_dir_path, "bin", "node-pre-gyp")} install`,
        "--fallback-to-build"
    ].join(" "), { "cwd": udev_dir_path });
    
})();

(function postinstall_node_python_messaging(){

    const node_python_messaging_dir_path= find_module_path(
        "node-python-messaging", module_dir_path
    );

    if (fs.existsSync(path.join(node_python_messaging_dir_path, "dist", "virtual"))) {
        return;
    }

    execSyncInherit("./install-python-dep.sh", { "cwd": node_python_messaging_dir_path });

})();

runInstaller();
