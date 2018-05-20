#!/usr/bin/env node

require("rejection-tracker").main(__dirname, "..", "..");

import * as program from "commander";
import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as scriptLib from "scripting-tools";
import * as readline from "readline";
import { InstallOptions } from "../lib/InstallOptions";
import { Astdirs } from "../lib/Astdirs";
import { AmiCredential } from "../lib/AmiCredential";
import { ini } from "ini-extended";
const execSync = (cmd: string) => scriptLib.execSync(cmd);
const execSyncSilent = (cmd: string) => scriptLib.execSync(cmd, { "stdio": [] });

const module_dir_path = path.join(__dirname, "..", "..");
const [cli_js_path, main_js_path] = [
    "cli.js", "main.js"
].map(f => path.join(module_dir_path, "dist", "bin", f));
const working_directory_path = path.join(module_dir_path, "working_directory");
const stop_sh_path = path.join(working_directory_path, "stop.sh");
const wait_ast_sh_path = path.join(working_directory_path, "wait_ast.sh");
const node_path = path.join(module_dir_path, "node");
const pkg_list_path = path.join(module_dir_path, "pkg_installed.json");

const unix_user = "chan_dongle";
const srv_name = "chan_dongle";

Astdirs.dir_path = working_directory_path;
InstallOptions.dir_path = working_directory_path;
AmiCredential.dir_path= working_directory_path;

scriptLib.apt_get_install.onInstallSuccess = package_name =>
    scriptLib.apt_get_install.record_installed_package(pkg_list_path, package_name);

let _install = program.command("install");

for (let key in InstallOptions.defaults) {

    let value = InstallOptions.defaults[key];

    switch (typeof value) {
        case "string":
            _install = _install.option(`--${key} [{${key}}]`, `default: ${value}`);
            break;
        case "number":
            _install = _install.option(`--${key} <{${key}}>`, `default: ${value}`, parseInt);
            break;
        case "boolean":
            _install = _install.option(`--${key}`, `default: ${value}`);
            break;
    }

}


_install.action(async options => {

    console.log("---Installing chan-dongle-extended---");


    if (fs.existsSync(working_directory_path)) {

        process.stdout.write(scriptLib.colorize("Already installed, uninstalling previous install... ", "YELLOW"));

        await uninstall();

        console.log("DONE");

    } else {

        unixUser.gracefullyKillProcess();

    }

    (() => {

        let previous_working_directory_path: string;

        try {

            previous_working_directory_path = execSyncSilent(`dirname $(readlink -e $(which dongle))`).replace("\n","");

        } catch{

            return;

        }

        process.stdout.write(scriptLib.colorize("Previous install found, uninstalling... ", "YELLOW"));

        execSyncSilent(`${path.join(previous_working_directory_path, "uninstaller.sh")} run`);

        console.log("DONE");

    })();

    try {

        await install(options);

    } catch({ message }){

        process.stdout.write(scriptLib.colorize(`An error occurred: '${message}', rollback ...`, "RED"));

        await uninstall();

        console.log("DONE");

        process.exit(-1);

        return;

    }

    console.log("---DONE---");

    process.exit(0);

});

program
    .command("uninstall")
    .action(async () => {

        console.log("---Uninstalling chan-dongle-extended---");

        uninstall("VERBOSE");

        console.log("---DONE---");

        if (fs.existsSync(pkg_list_path)) {

            let pkg_list = require(pkg_list_path);

            console.log([
                "NOTE: Some packages have been installed automatically, ",
                "you can remove them if you no longer need them.",
                "\n",
                `$ sudo apt-get purge ${pkg_list.join(" ")}`,
                "\n",
                `$ sudo apt-get --purge autoremove`
            ].join(""));

        }

        process.exit(0);

    });

program
    .command("tarball")
    .action(async () => {

        const v_name = [
            "dongle",
            //`v${require(path.join(module_dir_path, "package.json"))["version"]}`,
            child_process.execSync("uname -m").toString("utf8").replace("\n", "")
        ].join("_");

        const dir_path = path.join("/tmp", v_name);

        scriptLib.execSyncTrace(`rm -rf ${dir_path}`);

        scriptLib.execSyncTrace(`cp -r ${module_dir_path} ${dir_path}`);

        (()=>{

            const new_node_path= path.join(dir_path,"node");

            if( !fs.existsSync(new_node_path) ){

                scriptLib.execSyncTrace(`cp $(readlink -e ${process.argv[0]}) ${new_node_path}`);

            }

        })();


        (() => {

            let node_python_messaging_path = find_module_path("node-python-messaging", dir_path);

            scriptLib.execSyncTrace(`rm -r ${path.join(node_python_messaging_path, "dist", "virtual")}`);

        })();

        (() => {

            let udev_module_path = find_module_path("udev", dir_path);

            scriptLib.execSyncTrace(`rm -r ${path.join(udev_module_path, "build")}`);

        })();

        for (let name of [".git", ".gitignore", "src", "tsconfig.json"]) {
            scriptLib.execSyncTrace(`rm -rf ${path.join(dir_path, name)}`);
        }

        for (let name of ["@types", "typescript"]) {
            scriptLib.execSyncTrace(`rm -r ${path.join(dir_path, "node_modules", name)}`);
        }

        scriptLib.execSyncTrace(`find ${path.join(dir_path, "node_modules")} -type f -name "*.ts" -exec rm -rf {} \\;`);

        scriptLib.execSyncTrace(`rm -rf ${path.join(dir_path, path.basename(working_directory_path))}`);

        (function hide_auth_token() {

            let files = child_process.execSync(`find . -name "package-lock.json" -o -name "package.json"`, { "cwd": dir_path })
                .toString("utf8")
                .slice(0, -1)
                .split("\n")
                .map(rp => path.join(dir_path, rp));

            for (let file of files) {

                fs.writeFileSync(
                    file,
                    Buffer.from(
                        fs.readFileSync(file)
                            .toString("utf8")
                            .replace(/[0-9a-f]+:x-oauth-basic/g, "xxxxxxxxxxxxxxxx"),
                        "utf8"
                    )
                );

            }

        })();

        scriptLib.execSyncTrace(`tar -czf ${path.join(module_dir_path, `${v_name}.tar.gz`)} -C ${dir_path} .`);

        scriptLib.execSyncTrace(`rm -r ${dir_path}`);

        console.log("---DONE---");

    });

async function install(options: Partial<InstallOptions>) {

    unixUser.create();

    workingDirectory.create();

    InstallOptions.set(options);

    await install_prereq();

    if (fs.existsSync(path.join(module_dir_path, ".git"))) {

        /*
        let stat = fs.statSync(module_dir_path);

        child_process.execSync("npm install", {
            "cwd": module_dir_path,
            "uid": stat.uid,
            "gid": stat.gid,
            "stdio": "inherit"
        });
        */

    } else {

        await rebuild_node_modules();

    }

    if (!InstallOptions.get().assume_asterisk_installed) {

        await apt_get_install_asterisk();

    }

    Astdirs.set(InstallOptions.get().asterisk_main_conf);

    modemManager.disable_and_stop();

    if( !fs.existsSync(node_path) ){

        execSync(`cp $(readlink -e ${process.argv[0]}) ${node_path}`);

    }

    await tty0tty.install();

    if (InstallOptions.get().assume_chan_dongle_installed) {

        console.log(scriptLib.colorize("Assuming chan_dongle already installed.", "YELLOW"));

        chan_dongle.linkDongleConfigFile();

    } else {

        await chan_dongle.install();

    }

    await udevRules.create();

    shellScripts.create();

    asterisk_manager.enable();

    systemd.create();

}

function uninstall(verbose?: "VERBOSE" | undefined) {

    const write: (str: string) => void = !!verbose ? process.stdout.write.bind(process.stdout) : (() => { });
    const log = (str: string) => write(`${str}\n`);

    const runRecover = (description: string, action: () => void) => {

        write(description);

        try {

            action();

            log(scriptLib.colorize("ok", "GREEN"));

        } catch ({ message }) {

            log(scriptLib.colorize(message, "RED"));

        }

    }

    runRecover("Stopping running instance ... ", () => execSyncSilent(stop_sh_path));

    runRecover("Uninstalling chan_dongle.so ... ", () => chan_dongle.remove());

    runRecover("Restoring asterisk manager ... ", () => asterisk_manager.restore());

    runRecover("Removing binary symbolic links ... ", () => shellScripts.remove_symbolic_links());

    runRecover("Removing systemd service ... ", () => systemd.remove());

    runRecover("Removing udev rules ... ", () => udevRules.remove());

    runRecover("Removing tty0tty kernel module ...", () => tty0tty.remove());

    runRecover("Removing app working directory ... ", () => workingDirectory.remove());

    runRecover("Deleting unix user ... ", () => unixUser.remove());

    runRecover("Re enabling ModemManager if present...", () => modemManager.enable_and_start());

}

namespace tty0tty {

    const h_dir_path = path.join(working_directory_path, "linux-headers");

    const build_link_path = `/lib/modules/$(uname -r)/build`;

    async function remove_local_linux_headers() {

        try {

            await scriptLib.exec(`rm -r ${h_dir_path} 2>/dev/null`);

        } catch{

            return;

        }

        execSync(`rm ${build_link_path}`);

    }

    async function install_linux_headers() {

        let kernel_release = execSync("uname -r").replace(/\n$/, "");

        const are_headers_installed = (): boolean => {

            try {

                execSync(`ls ${path.join(build_link_path, "include")} 2>/dev/null`);

            } catch{

                return false;

            }

            return true;

        };

        process.stdout.write("Checking for linux kernel headers ...");

        if (are_headers_installed()) {

            console.log(`found. ${scriptLib.colorize("OK", "GREEN")}`);

            return;

        }

        readline.clearLine(process.stdout, 0);
        process.stdout.write("\r");

        const is_raspbian_host = !!execSync("cat /etc/os-release").match(/^NAME=.*Raspbian.*$/m);

        if (!is_raspbian_host) {

            await scriptLib.apt_get_install_if_missing(`linux-headers-$(uname -r)`);

            return;

        }

        let h_deb_path = path.join(working_directory_path, "linux-headers.deb");

        let downloaded_from: "OFFICIAL" | "MHIIENKA";

        await (async function download_deb() {

            let { onError, onSuccess } = scriptLib.start_long_running_process("Downloading raspberrypi linux headers");

            const wget = (url: string) => scriptLib.exec(`wget ${url} -O ${h_deb_path}`);

            try {

                let firmware_release = execSync("zcat /usr/share/doc/raspberrypi-bootloader/changelog.Debian.gz | head")
                    .match(/^[^r]*raspberrypi-firmware\ \(([^\)]+)\)/)![1]
                    ;

                let url = [
                    "https://archive.raspberrypi.org/debian/pool/main/r/raspberrypi-firmware/",
                    `raspberrypi-kernel-headers_${firmware_release}_armhf.deb`
                ].join("");

                await wget(url);

                downloaded_from= "OFFICIAL";

            } catch{

                try {

                    let url = [
                        "https://www.niksula.hut.fi/~mhiienka/Rpi/linux-headers-rpi" + (kernel_release[0] === "3" ? "/3.x.x/" : "/"),
                        `linux-headers-${kernel_release}_${kernel_release}-2_armhf.deb`
                    ].join("");

                    await wget(url);

                    downloaded_from= "MHIIENKA";

                } catch{

                    onError("linux-kernel headers for raspberry pi not found");

                    throw new Error()

                }

            }

            onSuccess("DONE");


        }());

        await (async function install_deb() {

            if( downloaded_from! === "MHIIENKA" ){

                for( const pkg_name of [ "gcc-4.7", "bc", "dkms" ] ){

                    await scriptLib.apt_get_install(pkg_name);

                }

            }

            let { exec, onSuccess } = scriptLib.start_long_running_process("Installing linux headers");

            if (downloaded_from! === "OFFICIAL") {

                await exec(`dpkg -x ${h_deb_path} ${h_dir_path}`);

                await exec(`rm ${h_deb_path}`);

                let build_dir_path = path.join(h_dir_path, "usr", "src", `linux-headers-${kernel_release}`);

                execSync(`mv ${path.join(h_dir_path, "usr", "src", kernel_release)} ${build_dir_path} 2>/dev/null || true`);

                execSync(`ln -sf ${build_dir_path} ${build_link_path}`);

            } else {

                await exec(`dpkg -i ${h_deb_path}`);

                await exec(`rm ${h_deb_path}`);

                //TODO: for uninstalling:  dpkg -r linux-headers-$(uname -r)

            }

            onSuccess("DONE");

        })();

    }

    const load_module_file_path = "/etc/modules";

    export async function install() {

        await install_linux_headers();

        await scriptLib.apt_get_install_if_missing("git", "git");

        let { exec, onSuccess } = scriptLib.start_long_running_process("Building and installing tty0tty kernel module");

        const tty0tty_dir_path = path.join(working_directory_path, "tty0tty");

        const cdExec = (cmd: string) => exec(`(cd ${path.join(tty0tty_dir_path, "module")} && ${cmd})`);

        await exec(`git clone https://github.com/garronej/tty0tty ${tty0tty_dir_path}`);

        await cdExec("make");

        await remove_local_linux_headers();

        await cdExec("cp tty0tty.ko /lib/modules/$(uname -r)/kernel/drivers/misc/");

        await exec("depmod");

        await exec("modprobe tty0tty");

        try {

            execSync(`cat ${load_module_file_path} | grep tty0tty`);

        } catch {

            await exec(`echo tty0tty >> ${load_module_file_path}`);

        }

        onSuccess("OK");

    }

    export function remove() {

        fs.writeFileSync(
            load_module_file_path,
            Buffer.from(
                `${fs.readFileSync(load_module_file_path)}`.replace("tty0tty", ""),
                "utf8"
            )
        );

        execSyncSilent(`rm -f /lib/modules/$(uname -r)/kernel/drivers/misc/tty0tty.ko`);

    }

}

namespace chan_dongle {

    const chan_dongle_dir_path = path.join(working_directory_path, "asterisk-chan-dongle");

    export function linkDongleConfigFile(): void {

        const { astetcdir } = Astdirs.get();

        let dongle_etc_path = path.join(astetcdir, "dongle.conf");
        let dongle_loc_path = path.join(working_directory_path, "dongle.conf");

        execSync(`touch ${dongle_etc_path}`);

        execSync(`mv ${dongle_etc_path} ${dongle_loc_path}`);

        execSync(`chown ${unix_user}:${unix_user} ${dongle_loc_path}`);

        execSync(`ln -s ${dongle_loc_path} ${dongle_etc_path}`);

        execSync(`chmod u+rw,g+r,o+r ${dongle_loc_path}`);

    }

    export async function install() {

        const { astsbindir, astmoddir } = Astdirs.get();

        const { ast_include_dir_path, ld_library_path_for_asterisk } = InstallOptions.get();

        await scriptLib.apt_get_install_if_missing("automake");

        let { exec, onSuccess } = scriptLib.start_long_running_process(
            `Building and installing asterisk chan_dongle ( may take several minutes )`
        );

        let ast_ver = execSync(`LD_LIBRARY_PATH=${ld_library_path_for_asterisk} ${path.join(astsbindir, "asterisk")} -V`)
            .match(/^Asterisk\s+([0-9\.]+)/)![1]
            ;

        const cdExec = (cmd: string) => exec(`(cd ${chan_dongle_dir_path} && ${cmd})`);

        await exec(`git clone https://github.com/garronej/asterisk-chan-dongle ${chan_dongle_dir_path}`);

        await cdExec("./bootstrap");

        await cdExec(`./configure --with-astversion=${ast_ver} --with-asterisk=${ast_include_dir_path}`);

        await cdExec("make");

        await cdExec(`cp chan_dongle.so ${astmoddir}`);

        linkDongleConfigFile();

        onSuccess("OK");

    }

    export function remove() {

        const { astmoddir, astsbindir, astetcdir } = Astdirs.get();

        execSyncSilent(`rm -rf ${path.join(astetcdir, "dongle.conf")}`);

        try {

            execSyncSilent([
                `LD_LIBRARY_PATH=${InstallOptions.get().ld_library_path_for_asterisk}`,
                `${path.join(astsbindir, "asterisk")}`,
                `-rx "module unload chan_dongle.so"`
            ].join(" "));

        } catch{ }

        execSyncSilent(`rm -f ${path.join(astmoddir, "chan_dongle.so")}`);

    }

}

namespace workingDirectory {

    export function create() {

        process.stdout.write(`Creating app working directory '${working_directory_path}' ... `);

        execSync(`mkdir ${working_directory_path}`);

        execSync(`chown ${unix_user}:${unix_user} ${working_directory_path}`);

        console.log(scriptLib.colorize("OK", "GREEN"));
    }

    export function remove() {

        execSyncSilent(`rm -r ${working_directory_path}`);

    }

}

namespace unixUser {

    export const gracefullyKillProcess = () => execSyncSilent(`pkill -u ${unix_user} -SIGUSR2 || true`);

    export function create() {

        process.stdout.write(`Creating unix user '${unix_user}' ... `);

        gracefullyKillProcess();

        execSyncSilent(`userdel ${unix_user} || true`);

        execSync(`useradd -M ${unix_user} -s /bin/false -d ${working_directory_path}`);

        console.log(scriptLib.colorize("OK", "GREEN"));

    }

    export function remove() {

        execSyncSilent(`userdel ${unix_user}`);

    }

}

namespace shellScripts {

    const get_uninstaller_link_path = (astsbindir: string) => path.join(astsbindir, `${srv_name}_uninstaller`);

    const cli_link_path = "/usr/bin/dongle";

    export function create(): void {

        const { astsbindir } = Astdirs.get();

        process.stdout.write(`Creating launch scripts ... `);

        const writeAndSetPerms = (script_path: string, script: string): void => {

            fs.writeFileSync(script_path, Buffer.from(script, "utf8"));

            execSync(`chown ${unix_user}:${unix_user} ${script_path}`);

            execSync(`chmod +x ${script_path}`);

        };

        writeAndSetPerms(
            stop_sh_path,
            [
                `#!/usr/bin/env bash`,
                ``,
                `# Calling this script will cause any running instance of the service`,
                `# to end without error, the systemd service will not be restarted`,
                ``,
                `pkill -u ${unix_user} -SIGUSR2 || true`,
                ``
            ].join("\n")
        );

        writeAndSetPerms(
            wait_ast_sh_path,
            [
                `#!/usr/bin/env bash`,
                ``,
                `# This script does not return until asterisk if fully booted`,
                ``,
                `LD_LIBRARY_PATH=${InstallOptions.get().ld_library_path_for_asterisk}`,
                ``,
                `until ${path.join(astsbindir, "asterisk")} -rx "core waitfullybooted"`,
                `do`,
                `   sleep 3`,
                `done`,
                ``
            ].join("\n")
        );

        const cli_sh_path = path.join(working_directory_path, "cli.sh");

        writeAndSetPerms(
            cli_sh_path,
            [
                `#!/usr/bin/env bash`,
                ``,
                `# This script is a proxy to the cli interface of the service ( run $ dongle --help )`,
                `# It is in charge of calling the cli.js with the right $HOME, via the bundled`,
                `# version of node.js`,
                ``,
                `cd ${working_directory_path}`,
                `args=""`,
                `for param in "$@"`,
                `do`,
                `   args="$args \\"$param\\""`,
                `done`,
                `eval "${node_path} ${cli_js_path} $args"`,
                ``
            ].join("\n")
        );

        execSync(`ln -sf ${cli_sh_path} ${cli_link_path}`);

        const uninstaller_sh_path = path.join(working_directory_path, "uninstaller.sh");

        writeAndSetPerms(
            uninstaller_sh_path,
            [
                `#!/bin/bash`,
                ``,
                `# Will uninstall the service and remove source if installed from tarball`,
                ``,
                `if [ "$1" == "run" ]`,
                `then`,
                `   if [[ $EUID -ne 0 ]]; then`,
                `       echo "This script require root privileges."`,
                `       exit 1`,
                `   fi`,
                `   ${node_path} ${__filename} uninstall`,
                `   ${fs.existsSync(path.join(module_dir_path, ".git")) ? `` : `rm -r ${module_dir_path}`}`,
                `else`,
                `   echo "If you wish to uninstall chan-dongle-extended call this script with 'run' as argument:"`,
                `   echo "$0 run"`,
                `fi`,
                ``
            ].join("\n")
        );

        execSync(`ln -sf ${uninstaller_sh_path} ${get_uninstaller_link_path(astsbindir)}`);

        writeAndSetPerms(
            path.join(working_directory_path, "start.sh"),
            [
                `#!/usr/bin/env bash`,
                ``,
                `# In charge of launching the service in interactive mode (via $ nmp start)`,
                `# It will gracefully terminate any running instance before.`,
                ``,
                `${stop_sh_path}`,
                `${wait_ast_sh_path}`,
                `cd ${working_directory_path}`,
                `su -s $(which bash) -c "${node_path} ${main_js_path}" ${unix_user}`,
                ``
            ].join("\n")
        );

        console.log(scriptLib.colorize("OK", "GREEN"));


    }

    export function remove_symbolic_links() {

        const { astsbindir } = Astdirs.get();

        execSyncSilent(
            `rm -f ${cli_link_path} ${get_uninstaller_link_path(astsbindir)}`
        );

    }

}


namespace systemd {


    const service_file_path = path.join("/etc/systemd/system", `${srv_name}.service`);

    export function create(): void {

        process.stdout.write(`Creating systemd service ${service_file_path} ... `);

        let service = [
            `[Unit]`,
            `Description=chan-dongle-extended service.`,
            `After=network.target`,
            ``,
            `[Service]`,
            `ExecStartPre=${stop_sh_path} && ${wait_ast_sh_path}`,
            `ExecStart=${node_path} ${main_js_path}`,
            `Environment=NODE_ENV=production`,
            `PermissionsStartOnly=true`,
            `StandardOutput=journal`,
            `WorkingDirectory=${working_directory_path}`,
            `Restart=always`,
            `RestartPreventExitStatus=0`,
            `RestartSec=10`,
            `User=${unix_user}`,
            `Group=${unix_user}`,
            ``,
            `[Install]`,
            `WantedBy=multi-user.target`,
            ``
        ].join("\n");

        fs.writeFileSync(service_file_path, Buffer.from(service, "utf8"));

        execSync("systemctl daemon-reload");

        execSync(`systemctl enable ${srv_name} --quiet`);

        execSync(`systemctl start ${srv_name}`);

        console.log(scriptLib.colorize("OK", "GREEN"));

    }

    export function remove() {

        try {

            execSyncSilent(`systemctl disable ${srv_name} --quiet`);

            fs.unlinkSync(service_file_path);

        } catch{ }

        execSyncSilent("systemctl daemon-reload");

    }

}

namespace asterisk_manager {

    const ami_conf_back_path = path.join(working_directory_path, "manager.conf.back");
    const get_ami_conf_path = () => path.join(Astdirs.get().astetcdir, "manager.conf");

    export function enable() {

        process.stdout.write(`Enabling asterisk manager ... `);

        const credential = {
            "host": "127.0.0.1",
            "port": InstallOptions.get().enable_ast_ami_on_port,
            "user": "chan_dongle_extended",
            "secret": `${Date.now()}`
        };

        const ami_conf_path = get_ami_conf_path();

        if (!fs.existsSync(ami_conf_path)) {

            const stat = fs.statSync(InstallOptions.get().asterisk_main_conf);

            child_process.execSync(`touch ${ami_conf_path}`, {
                "uid": stat.uid,
                "gid": stat.gid
            });

            fs.chmodSync(ami_conf_path, stat.mode);

        }

        execSync(`cp -p ${ami_conf_path} ${ami_conf_back_path}`);

        let general = {
            "enabled": "yes",
            "port": credential.port,
            "bindaddr": "127.0.0.1",
            "displayconnects": "yes"
        };

        try {

            general = ini.parseStripWhitespace(
                fs.readFileSync(ami_conf_path).toString("utf8")
            ).general;

            general.enabled = "yes";
            general.port = credential.port;

        } catch{ }


        fs.writeFileSync(
            ami_conf_path,
            Buffer.from(ini.stringify({
                general,
                [credential.user]: {
                    "secret": credential.secret,
                    "deny": "0.0.0.0/0.0.0.0",
                    "permit": "0.0.0.0/0.0.0.0",
                    "read": "all",
                    "write": "all",
                    "writetimeout": "5000"
                }
            }), "utf8")
        );

        try {

            execSyncSilent([
                `LD_LIBRARY_PATH=${InstallOptions.get().ld_library_path_for_asterisk}`,
                `${path.join(Astdirs.get().astsbindir, "asterisk")}`,
                `-rx "core reload"`
            ].join(" "));

        } catch{ }

        AmiCredential.set(credential);

        console.log(scriptLib.colorize("OK", "GREEN"));

    }

    export function restore() {

        execSyncSilent(`mv ${ami_conf_back_path} ${get_ami_conf_path()}`);

        try {

            execSyncSilent([
                `LD_LIBRARY_PATH=${InstallOptions.get().ld_library_path_for_asterisk}`,
                `${path.join(Astdirs.get().astsbindir, "asterisk")}`,
                `-rx "core reload"`
            ].join(" "));

        } catch{ }

    }

}

namespace udevRules {

    const rules_path = path.join("/etc/udev/rules.d", `98-${srv_name}.rules`);

    export async function create() {

        await scriptLib.apt_get_install("usb-modeswitch");

        //NOTE: we could grant access only to "dongle" group as asterisk is added to this group but need restart ast...

        process.stdout.write(`Creating udev rules ${rules_path} ... `);

        execSync(`mkdir -p ${path.dirname(rules_path)}`);

        const { recordIfNum, ConnectionMonitor } = await import("ts-gsm-modem");
        const vendorIds = Object.keys(recordIfNum);

        let rules = "# Automatically generated by chan-dongle-extended.\n\n";

        for (let vendorId of vendorIds) {

            rules += [
                `ACTION=="add"`,
                `ENV{ID_VENDOR_ID}=="${vendorId}"`,
                `ENV{SUBSYSTEM}=="tty"`,
                `ENV{ID_USB_INTERFACE_NUM}=="[0-9]*"`,
                `MODE="0666"`,
                `GROUP="${unix_user}"`
            ].join(", ") + `\n`;

            rules += [
                `ACTION=="add"`,
                `ENV{ID_VENDOR_ID}=="${vendorId}"`,
                `ENV{SUBSYSTEM}=="net"`,
                `ENV{ID_USB_INTERFACE_NUM}=="[0-9]*"`,
                `RUN+="/bin/sh -c 'echo 0 > /sys$DEVPATH/device/authorized'"`
            ].join(", ") + `\n`;

        }

        rules += [
            `ACTION=="add"`,
            `ENV{DEVPATH}=="/devices/virtual/tty/tnt[0-9]*"`,
            `MODE="0666"`,
            `GROUP="${unix_user}"`
        ].join(", ") + `\n`;

        fs.writeFileSync(rules_path, rules);

        execSync("systemctl restart udev.service");

        console.log(scriptLib.colorize("OK", "GREEN"));

        execSync(`chown ${unix_user}:${unix_user} ${rules_path}`);

        await (async function applying_rules() {

            execSync(`chown root:${unix_user} /dev/tnt*`);

            execSync("chmod u+rw,g+rw,o+rw /dev/tnt*");

            let monitor = ConnectionMonitor.getInstance();

            console.log("Detecting currently connected modems ... ");

            await new Promise<void>(resolve => setTimeout(() => resolve(), 4100));

            if (!monitor.connectedModems.size) {

                console.log("No USB dongles currently connected.");

            }

            for (let accessPoint of monitor.connectedModems) {

                for (let device_path of [accessPoint.audioIfPath, accessPoint.dataIfPath]) {

                    execSync(`chown root:${unix_user} ${device_path}`);

                    execSync(`chmod u+rw,g+rw,o+rw ${device_path}`);

                }


            }

        })();

    }

    export function remove() {

        execSyncSilent(`rm -rf ${rules_path}`);

        execSyncSilent("systemctl restart udev.service");

    }

}

async function apt_get_install_asterisk() {

    if (!scriptLib.apt_get_install_if_missing.isPkgInstalled("asterisk")) {

        execSyncSilent("dpkg -P asterisk-config");

    }

    let pr_install_ast = scriptLib.apt_get_install_if_missing("asterisk-dev", "asterisk");

    let service_path = "/lib/systemd/system/asterisk.service";

    let watcher = fs.watch(path.dirname(service_path), (event, filename) => {

        if (
            event === 'rename' &&
            filename === path.basename(service_path) &&
            fs.existsSync(service_path)
        ) {

            fs.writeFileSync(service_path,
                Buffer.from(
                    fs.readFileSync(service_path).toString("utf8").replace(
                        "\n[Service]\n", "\n[Service]\nTimeoutSec=infinity\n"
                    ), "utf8")
            );

            execSync("systemctl daemon-reload");

        }

    });

    await pr_install_ast;

    watcher.close();

}

namespace modemManager {

    export function disable_and_stop() {

        try {

            execSyncSilent("systemctl stop ModemManager");

            console.log(scriptLib.colorize([
                "ModemManager was previously managing dongles on this host, is has been disabled. ",
                "You need to disconnect and reconnect your GSM dongles"
            ].join("\n"), "YELLOW"));

        } catch{ }

        try {

            execSyncSilent("systemctl disable ModemManager");

        } catch{ }

    }

    export function enable_and_start() {

        try {

            execSyncSilent("systemctl enable ModemManager");

        } catch{ }

        try {

            execSyncSilent("systemctl start ModemManager");

        } catch{ }

    }

}

async function install_prereq() {

    await scriptLib.apt_get_install_if_missing("python", "python");
    //NOTE assume python 2 available. var range = semver.Range('>=2.5.0 <3.0.0')
    await scriptLib.apt_get_install_if_missing("python-pip", "pip");

    await (async function installVirtualenv() {

        process.stdout.write(`Checking for python module virtualenv ... `);

        try {

            execSync(`which virtualenv`);

        } catch{

            readline.clearLine(process.stdout, 0);
            process.stdout.write("\r");

            const { exec, onSuccess } = scriptLib.start_long_running_process("Installing virtualenv");

            try {

                await scriptLib.exec(`pip install virtualenv`);


            } catch {

                await exec(`pip install -i https://pypi.python.org/simple/ --upgrade pip`);

                await exec(`pip install virtualenv`);

            }

            onSuccess("DONE");

            return;

        }

        console.log(`found. ${scriptLib.colorize("OK", "GREEN")}`);

    })();

    await scriptLib.apt_get_install_if_missing("build-essential");

    await scriptLib.apt_get_install_if_missing("libudev-dev");

};

function find_module_path(
    module_name: string,
    root_module_path: string
): string {

    let cmd = [
        `find ${path.join(root_module_path, "node_modules")}`,
        `-type f`,
        `-path \\*/node_modules/${module_name}/package.json`,
        `-exec dirname {} \\;`
    ].join(" ");

    let match = child_process
        .execSync(cmd, { "stdio": [] })
        .toString("utf8")
        .slice(0, -1)
        .split("\n");

    if (!match.length) {
        throw new Error("Not found");
    } else {
        return match.sort((a, b) => a.length - b.length)[0];
    }

}

async function rebuild_node_modules() {

    const { exec, onSuccess } = scriptLib.start_long_running_process("Building node_modules dependencies");

    const cdExec = (cmd: string, dir_path: string) => exec(`(cd ${dir_path} && ${cmd})`);

    await (async function build_udev() {

        const udev_dir_path = find_module_path("udev", module_dir_path);

        if (fs.existsSync(path.join(udev_dir_path, "build"))) {
            return;
        }

        let pre_gyp_dir_path: string = "";

        for (let root_module_path of [udev_dir_path, module_dir_path]) {

            try {

                pre_gyp_dir_path = find_module_path("node-pre-gyp", root_module_path);

                break;

            } catch{ }

        }

        await cdExec([
            `PATH=${path.join(module_dir_path)}:$PATH`,
            `node ${path.join(pre_gyp_dir_path, "bin", "node-pre-gyp")} install`,
            "--fallback-to-build"
        ].join(" "),
            udev_dir_path
        );

    })();

    await (async function postinstall_node_python_messaging() {

        const node_python_messaging_dir_path = find_module_path(
            "node-python-messaging", module_dir_path
        );

        if (fs.existsSync(path.join(node_python_messaging_dir_path, "dist", "virtual"))) {
            return;
        }

        await cdExec(
            "./install-python-dep.sh",
            node_python_messaging_dir_path
        );

    })();

    onSuccess("DONE");

}

if (require.main === module) {
    scriptLib.exit_if_not_root();
    program.parse(process.argv);
}

