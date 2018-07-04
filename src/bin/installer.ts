import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as scriptLib from "scripting-tools";
import * as readline from "readline";
import { ini } from "ini-extended";

export const unix_user_default = "chan_dongle";
export const srv_name = "chan_dongle";

const module_dir_path = path.join(__dirname, "..", "..");
const cli_js_path = path.join(__dirname, "cli.js");
export const working_directory_path = path.join(module_dir_path, "working_directory");
export const node_path = path.join(module_dir_path, "node");
const installed_pkg_record_path = path.join(module_dir_path, "pkg_installed.json");
export const pidfile_path = path.join(working_directory_path, "pid");
const uninstaller_link_default_path = `/usr/sbin/dongle_uninstaller`;

export const db_path = path.join(working_directory_path, "app.db");
const to_distribute_rel_paths = [
    "LICENSE",
    "README.md",
    `res/${path.basename(db_path)}`,
    "dist",
    "node_modules",
    "package.json",
    path.basename(node_path)
];

//Must be after declaration of working_directory_path and unix_user
import { InstallOptions } from "../lib/InstallOptions";
import { Astdirs } from "../lib/Astdirs";
import { AmiCredential } from "../lib/AmiCredential";

export function getIsProd(): boolean {

    if (getIsProd.value !== undefined) {
        return getIsProd.value;
    }

    getIsProd.value = !fs.existsSync(path.join(module_dir_path, ".git"));

    return getIsProd();

}

export namespace getIsProd {
    export let value: boolean | undefined = undefined;
}


async function program_action_install(options) {

    console.log(`---Installing ${srv_name}---`);

    if (
        fs.existsSync(uninstaller_link_default_path) &&
        path.dirname(scriptLib.sh_eval(`readlink -f ${uninstaller_link_default_path}`)) !== working_directory_path
    ) {

        process.stdout.write(scriptLib.colorize("Uninstalling previous instal found in other location... ", "YELLOW"));

        scriptLib.execSync(`${uninstaller_link_default_path} run`);

        console.log(scriptLib.colorize("DONE", "GREEN"));

    }

    uninstall();

    try {

        await install(options);

    } catch ({ message }) {

        console.log(scriptLib.colorize(`An error occurred: '${message}`, "RED"));

        uninstall();

        if (getIsProd()) {

            scriptLib.execSync(`rm -r ${module_dir_path}`);

        }

        process.exit(-1);

        return;

    }

    console.log("---DONE---");

    process.exit(0);

}

async function program_action_uninstall() {

    console.log(`---Uninstalling ${srv_name}---`);

    uninstall("VERBOSE");

    console.log("---DONE---");

    if (fs.existsSync(installed_pkg_record_path)) {

        console.log([
            "NOTE: Some packages have been installed automatically, ",
            "you can remove them if you no longer need them.",
            "\n",
            `$ sudo apt-get purge ${require(installed_pkg_record_path).join(" ")}`,
            "\n",
            `$ sudo apt-get --purge autoremove`
        ].join(""));

    }

    process.exit(0);
}

async function program_action_update(options) {

    if (!getIsProd()) {
        console.log(scriptLib.colorize("Should not update prod", "RED"));
        process.exit(1);
    }

    scriptLib.stopProcessSync(pidfile_path, "SIGUSR2");

    scriptLib.enableCmdTrace();

    const _module_dir_path = options["path"];

    const [db_schema_path, _db_schema_path] = [module_dir_path, _module_dir_path].map(v => path.join(v, "res", path.basename(db_path)));

    if (!scriptLib.fs_areSame(db_schema_path, _db_schema_path)) {

        scriptLib.fs_move("COPY", _db_schema_path, db_path);

    }

    const [
        node_python_messaging_dir_path,
        _node_python_messaging_dir_path
    ] = [module_dir_path, _module_dir_path].map(v => scriptLib.find_module_path("node-python-messaging", v));

    if (
        path.relative(module_dir_path, node_python_messaging_dir_path)
        ===
        path.relative(_module_dir_path, _node_python_messaging_dir_path)
    ) {

        scriptLib.fs_move("MOVE", node_python_messaging_dir_path, _node_python_messaging_dir_path);

    }

    if (scriptLib.fs_areSame(node_path, path.join(_module_dir_path, path.basename(node_path)))) {

        const [
            udev_dir_path,
            _udev_dir_path
        ] = [module_dir_path, _module_dir_path].map(v => scriptLib.find_module_path("udev", v));

        scriptLib.fs_move("MOVE", udev_dir_path, _udev_dir_path);

    }

    for (const name of to_distribute_rel_paths) {
        scriptLib.fs_move("MOVE", _module_dir_path, module_dir_path, name);
    }

    await rebuild_node_modules();

    if( !InstallOptions.get().do_not_create_systemd_conf ){

        scriptLib.execSync(`systemctl start ${srv_name}`);

    }

    console.log(scriptLib.colorize("Update success", "GREEN"));
}

async function program_action_tarball() {

    if (!fs.existsSync(node_path)) {
        throw new Error(`Missing node`);
    }

    scriptLib.enableCmdTrace();

    const _module_dir_path = path.join("/tmp", path.basename(module_dir_path));

    scriptLib.execSyncTrace(`rm -rf ${_module_dir_path}`);

    for (const name of to_distribute_rel_paths) {
        scriptLib.fs_move("COPY", module_dir_path, _module_dir_path, name);
    }


    const _node_modules_path = path.join(_module_dir_path, "node_modules");

    for (const name of ["@types", "typescript"]) {

        scriptLib.execSyncTrace(`rm -r ${path.join(_node_modules_path, name)}`);

    }

    scriptLib.execSyncTrace([
        "rm -r",
        path.join(
            scriptLib.find_module_path("node-python-messaging", _module_dir_path),
            "dist", "virtual"
        ),
        path.join(
            scriptLib.find_module_path("udev", _module_dir_path),
            "build"
        )
    ].join(" "));


    scriptLib.execSyncTrace(`find ${_node_modules_path} -type f -name "*.ts" -exec rm -rf {} \\;`);

    (function hide_auth_token() {

        let files = scriptLib.execSync(`find . -name "package-lock.json" -o -name "package.json"`, { "cwd": _module_dir_path })
            .slice(0, -1)
            .split("\n")
            .map(rp => path.join(_module_dir_path, rp));

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

    scriptLib.execSyncTrace([
        "tar -czf",
        path.join(module_dir_path, `dongle_${scriptLib.sh_eval("uname -m")}.tar.gz`),
        `-C ${_module_dir_path} .`
    ].join(" ")
    );

    scriptLib.execSyncTrace(`rm -r ${_module_dir_path}`);

    console.log("---DONE---");

}

async function install(options: Partial<InstallOptions>) {

    scriptLib.execSync(`mkdir ${working_directory_path}`);

    InstallOptions.set(options);

    const unix_user= InstallOptions.get().unix_user;

    if( unix_user === unix_user_default ){

        scriptLib.unixUser.create(unix_user, working_directory_path);

    }else{

        if( !scriptLib.sh_if(`id -u ${unix_user}`)){

            throw new Error(`Unix user ${unix_user} does not exist`);

        }

    }

    scriptLib.execSync(`chown ${unix_user}:${unix_user} ${working_directory_path}`);

    if (getIsProd()) {

        await install_prereq();

        await rebuild_node_modules();

    } else {

        if (!fs.existsSync(node_path)) {
            throw new Error(`${node_path} is missing`);
        }

        scriptLib.enableCmdTrace();

    }


    if (!InstallOptions.getDeduced().assume_asterisk_installed) {

        await apt_get_install_asterisk();

    }

    Astdirs.set(InstallOptions.get().asterisk_main_conf);

    modemManager.disable_and_stop();

    await tty0tty.install();

    if (InstallOptions.get().assume_chan_dongle_installed) {

        chan_dongle.linkDongleConfigFile();

    } else {

        await chan_dongle.install();

    }

    await udevRules.create();

    shellScripts.create();

    asterisk_manager.enable();

    scriptLib.execSync(
        `cp ${path.join(module_dir_path, "res", path.basename(db_path))} ${db_path}`,
        { "uid": scriptLib.get_uid(unix_user), "gid": scriptLib.get_gid(unix_user) }
    );

    if ( !InstallOptions.get().do_not_create_systemd_conf ) {

        scriptLib.systemd.createConfigFile(
            srv_name, path.join(__dirname, "main.js"), node_path, "ENABLE", "START"
        );

    }

}

function uninstall(verbose: false | "VERBOSE" = false) {

    const write: (str: string) => void = !!verbose ? process.stdout.write.bind(process.stdout) : (() => { });
    const log = (str: string) => write(`${str}\n`);

    const runRecover = async (description: string, action: () => void) => {

        write(description);

        try {

            action();


        } catch ({ message }) {

            log(scriptLib.colorize(message, "RED"));

        }

        log(scriptLib.colorize("ok", "GREEN"));

    }
    runRecover("Stopping running instance ... ", () => scriptLib.stopProcessSync(pidfile_path, "SIGUSR2"));

    runRecover("Removing systemd config file ... ", () => scriptLib.systemd.deleteConfigFile(srv_name));

    runRecover("Uninstalling chan_dongle.so ... ", () => chan_dongle.remove());

    runRecover("Restoring asterisk manager ... ", () => asterisk_manager.restore());

    runRecover("Removing binary symbolic links ... ", () => shellScripts.remove_symbolic_links());

    runRecover("Removing udev rules ... ", () => udevRules.remove());

    runRecover("Removing tty0tty kernel module ...", () => tty0tty.remove());

    runRecover("Removing app working directory ... ", () => scriptLib.execSyncQuiet(`rm -r ${working_directory_path}`));

    runRecover(`Deleting ${unix_user_default} unix user ... `, () => scriptLib.unixUser.remove(unix_user_default));

    runRecover("Re enabling ModemManager if present...", () => modemManager.enable_and_start());

}

namespace tty0tty {

    const h_dir_path = path.join(working_directory_path, "linux-headers");

    const build_link_path = "/lib/modules/$(uname -r)/build";

    async function remove_local_linux_headers() {

        try {

            await scriptLib.exec(`rm -r ${h_dir_path}`);

        } catch{

            return;

        }

        scriptLib.execSync(`rm ${build_link_path}`);

    }

    async function install_linux_headers() {

        let kernel_release = scriptLib.execSync("uname -r").replace(/\n$/, "");

        process.stdout.write("Checking for linux kernel headers ...");

        if (fs.existsSync(path.join(build_link_path, "include"))) {

            console.log(`found. ${scriptLib.colorize("OK", "GREEN")}`);

            return;
        }

        readline.clearLine(process.stdout, 0);
        process.stdout.write("\r");

        const is_raspbian_host = !!scriptLib.execSync("cat /etc/os-release").match(/^NAME=.*Raspbian.*$/m);

        if (!is_raspbian_host) {

            await scriptLib.apt_get_install_if_missing(`linux-headers-$(uname -r)`);

            return;

        }

        let h_deb_path = path.join(working_directory_path, "linux-headers.deb");

        let downloaded_from: "OFFICIAL" | "MHIIENKA";

        await (async function download_deb() {

            const { onError, onSuccess } = scriptLib.start_long_running_process("Downloading raspberrypi linux headers");

            try {

                const firmware_release = scriptLib.execSync("zcat /usr/share/doc/raspberrypi-bootloader/changelog.Debian.gz | head")
                    .match(/^[^r]*raspberrypi-firmware\ \(([^\)]+)\)/)![1]
                    ;

                const url = [
                    "https://archive.raspberrypi.org/debian/pool/main/r/raspberrypi-firmware/",
                    `raspberrypi-kernel-headers_${firmware_release}_armhf.deb`
                ].join("");

                await scriptLib.web_get(url, h_deb_path);

                downloaded_from = "OFFICIAL";

            } catch{

                try {

                    const url = [
                        "https://www.niksula.hut.fi/~mhiienka/Rpi/linux-headers-rpi" + (kernel_release[0] === "3" ? "/3.x.x/" : "/"),
                        `linux-headers-${kernel_release}_${kernel_release}-2_armhf.deb`
                    ].join("");

                    await scriptLib.web_get(url, h_deb_path);

                    downloaded_from = "MHIIENKA";

                } catch{

                    onError("linux-kernel headers for raspberry pi not found");

                    throw new Error()

                }

            }

            onSuccess("DONE");


        }());

        await (async function install_deb() {

            if (downloaded_from! === "MHIIENKA") {

                for (const pkg_name of ["gcc-4.7", "bc", "dkms"]) {

                    await scriptLib.apt_get_install(pkg_name);

                }

            }

            const { exec, onSuccess } = scriptLib.start_long_running_process("Installing linux headers");

            if (downloaded_from! === "OFFICIAL") {

                await exec(`dpkg -x ${h_deb_path} ${h_dir_path}`);

                await exec(`rm ${h_deb_path}`);

                let build_dir_path = path.join(h_dir_path, "usr", "src", `linux-headers-${kernel_release}`);

                //Suppress the source for the other version (+v7)
                scriptLib.execSyncQuiet(`mv ${path.join(h_dir_path, "usr", "src", kernel_release)} ${build_dir_path} || true`);

                scriptLib.execSync(`ln -sf ${build_dir_path} ${build_link_path}`);

            } else {

                await exec(`dpkg -i ${h_deb_path}`);

                await exec(`rm ${h_deb_path}`);

                //TODO: for uninstalling:  dpkg -r linux-headers-$(uname -r)

            }

            onSuccess("DONE");

        })();

    }

    const load_module_file_path = "/etc/modules";
    const ko_file_path = "/lib/modules/$(uname -r)/kernel/drivers/misc/tty0tty.ko";

    export async function install() {

        await install_linux_headers();

        await scriptLib.apt_get_install_if_missing("git", "git");

        const { exec, onSuccess } = scriptLib.start_long_running_process("Building and installing tty0tty kernel module");

        const tty0tty_dir_path = path.join(working_directory_path, "tty0tty");

        const cdExec = (cmd: string) => exec(cmd, { "cwd": path.join(tty0tty_dir_path, "module") });

        await exec(`git clone https://github.com/garronej/tty0tty ${tty0tty_dir_path}`);

        await cdExec("make");

        await remove_local_linux_headers();

        await cdExec(`cp tty0tty.ko ${ko_file_path}`);

        await exec(`rm -r ${tty0tty_dir_path}`);

        await exec("depmod");

        await exec("modprobe tty0tty");

        try {

            scriptLib.execSyncQuiet(`cat ${load_module_file_path} | grep tty0tty`);

        } catch {

            await exec(`echo tty0tty >> ${load_module_file_path}`);

        }

        onSuccess("OK");

    }

    export function remove() {

        fs.writeFileSync(
            load_module_file_path,
            Buffer.from(
                `${fs.readFileSync(load_module_file_path)}`.replace(/tty0tty\n?/g, ""),
                "utf8"
            )
        );

        scriptLib.execSyncQuiet(`rm -f ${ko_file_path}`);

    }

}

namespace chan_dongle {


    export function linkDongleConfigFile(): void {

        const { astetcdir } = Astdirs.get();

        let dongle_etc_path = path.join(astetcdir, "dongle.conf");
        let dongle_loc_path = path.join(working_directory_path, "dongle.conf");

        scriptLib.execSync(`touch ${dongle_etc_path}`);

        scriptLib.execSync(`mv ${dongle_etc_path} ${dongle_loc_path}`);

        (()=>{

            const unix_user= InstallOptions.get().unix_user;

            scriptLib.execSync(`chown ${unix_user}:${unix_user} ${dongle_loc_path}`);

        })();


        scriptLib.execSync(`ln -s ${dongle_loc_path} ${dongle_etc_path}`);

        scriptLib.execSync(`chmod u+rw,g+r,o+r ${dongle_loc_path}`);

    }

    export async function install() {

        const chan_dongle_dir_path = path.join(working_directory_path, "asterisk-chan-dongle");

        await scriptLib.apt_get_install_if_missing("automake");

        const { exec, onSuccess } = scriptLib.start_long_running_process(
            `Building and installing asterisk chan_dongle ( may take several minutes )`
        );

        const ast_ver = scriptLib.sh_eval(`${build_ast_cmdline()} -V`).match(/^Asterisk\s+([0-9\.]+)/)![1];

        const cdExec = (cmd: string) => exec(cmd, { "cwd": chan_dongle_dir_path });

        await exec(`git clone https://github.com/garronej/asterisk-chan-dongle ${chan_dongle_dir_path}`);

        await cdExec("./bootstrap");

        await cdExec(`./configure --with-astversion=${ast_ver} --with-asterisk=${InstallOptions.get().ast_include_dir_path}`);

        await cdExec("make");

        await cdExec(`cp chan_dongle.so ${Astdirs.get().astmoddir}`);

        await exec(`rm -r ${chan_dongle_dir_path}`);

        linkDongleConfigFile();

        onSuccess("OK");

    }

    export function remove() {

        const { astmoddir, astetcdir } = Astdirs.get();

        scriptLib.execSyncQuiet(`rm -rf ${path.join(astetcdir, "dongle.conf")}`);

        try {

            scriptLib.execSyncQuiet(
                `${build_ast_cmdline()} -rx "module unload chan_dongle.so"`,
                { "timeout": 5000 }
            );

        } catch{ }

        scriptLib.execSyncQuiet(`rm -f ${path.join(astmoddir, "chan_dongle.so")}`);

    }

}

/*
namespace workingDirectory {

    export function create(unix_user) {

        process.stdout.write(`Creating app working directory '${working_directory_path}' ... `);

        scriptLib.execSync(`mkdir ${working_directory_path}`);

        scriptLib.execSync(`chown ${unix_user_default}:${unix_user_default} ${working_directory_path}`);

        console.log(scriptLib.colorize("OK", "GREEN"));
    }

    export function remove() {

        scriptLib.execSyncQuiet(`rm -r ${working_directory_path}`);

    }

}
*/

namespace shellScripts {

    const get_uninstaller_link_path = () => path.join(Astdirs.get().astsbindir, path.basename(uninstaller_link_default_path));

    const cli_link_path = "/usr/bin/dongle";

    export function create(): void {

        process.stdout.write(`Creating launch scripts ... `);


        const cli_sh_path = path.join(working_directory_path, "cli.sh");

        scriptLib.createScript(
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

        scriptLib.execSyncQuiet(`ln -sf ${cli_sh_path} ${cli_link_path}`);

        const uninstaller_sh_path = path.join(working_directory_path, "uninstaller.sh");

        scriptLib.createScript(
            uninstaller_sh_path,
            [
                `#!/usr/bin/env bash`,
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
                `   ${getIsProd() ? `rm -r ${module_dir_path}` : ""}`,
                `else`,
                `   echo "If you wish to uninstall chan-dongle-extended call this script with 'run' as argument:"`,
                `   echo "$0 run"`,
                `fi`,
                ``
            ].join("\n")
        );

        scriptLib.createSymlink(uninstaller_sh_path, get_uninstaller_link_path());

        console.log(scriptLib.colorize("OK", "GREEN"));

    }

    export function remove_symbolic_links() {

        scriptLib.execSyncQuiet(`rm -f ${cli_link_path} ${get_uninstaller_link_path()}`);

    }

}

namespace asterisk_manager {

    const ami_conf_back_path = path.join(working_directory_path, "manager.conf.back");
    const get_ami_conf_path = () => path.join(Astdirs.get().astetcdir, "manager.conf");

    export function enable() {

        process.stdout.write(`Enabling asterisk manager ... `);

        const ami_conf_path = get_ami_conf_path();

        const general: any = {
            "enabled": "yes",
            "port": InstallOptions.get().enable_ast_ami_on_port,
            "bindaddr": "127.0.0.1",
            "displayconnects": "yes"
        };

        if (!fs.existsSync(ami_conf_path)) {

            const stat = fs.statSync(InstallOptions.get().asterisk_main_conf);

            child_process.execSync(`touch ${ami_conf_path}`, {
                "uid": stat.uid,
                "gid": stat.gid
            });

            scriptLib.execSync(`chmod 640 ${ami_conf_path}`);

        } else {

            scriptLib.execSync(`cp -p ${ami_conf_path} ${ami_conf_back_path}`);

            //TODO: test if return {} when empty file
            const parsed_general = ini.parseStripWhitespace(
                fs.readFileSync(ami_conf_path).toString("utf8")
            )["general"] || {};

            for (let key in parsed_general) {

                switch (key) {
                    case "enabled": break;
                    case "port":
                        if (!InstallOptions.getDeduced().overwrite_ami_port_if_enabled) {
                            general["port"] = parsed_general["port"];
                        }
                        break;
                    default: general[key] = parsed_general[key];
                }

            }

        }

        const credential = {
            "host": "127.0.0.1",
            "port": general["port"],
            "user": "chan_dongle_extended",
            "secret": `${Date.now()}`
        };

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

            scriptLib.execSyncQuiet(
                `${build_ast_cmdline()} -rx "core reload"`,
                { "timeout": 5000 }
            );

        } catch{ }

        AmiCredential.set(credential);

        console.log(scriptLib.colorize("OK", "GREEN"));

    }

    export function restore() {

        scriptLib.execSyncQuiet(`rm -f ${get_ami_conf_path()}`);

        if (fs.existsSync(ami_conf_back_path)) {

            scriptLib.execSyncQuiet(`mv ${ami_conf_back_path} ${get_ami_conf_path()}`);

        }

        try {

            scriptLib.execSyncQuiet(
                `${build_ast_cmdline()} -rx "core reload"`,
                { "timeout": 5000 }
            );

        } catch{ }

    }

}

namespace udevRules {

    const rules_path = path.join("/etc/udev/rules.d", `98-${srv_name}.rules`);

    export async function create() {

        await scriptLib.apt_get_install("usb-modeswitch");

        //NOTE: we could grant access only to "dongle" group as asterisk is added to this group but need restart ast...

        process.stdout.write(`Creating udev rules ${rules_path} ... `);

        scriptLib.execSync(`mkdir -p ${path.dirname(rules_path)}`);

        const unix_user= InstallOptions.get().unix_user;
        const { recordIfNum, ConnectionMonitor } = await import("ts-gsm-modem");
        const vendorIds = Object.keys(recordIfNum);

        let rules = "# Automatically generated by chan-dongle-extended. (disable network on dongles )\n\n";

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

        scriptLib.execSync("systemctl restart udev.service");

        console.log(scriptLib.colorize("OK", "GREEN"));

        scriptLib.execSync(`chown ${unix_user}:${unix_user} ${rules_path}`);

        await (async function applying_rules() {

            scriptLib.execSync(`chown root:${unix_user} /dev/tnt*`);

            scriptLib.execSync("chmod u+rw,g+rw,o+rw /dev/tnt*");

            let monitor = ConnectionMonitor.getInstance();

            console.log("Detecting currently connected modems ... ");

            await new Promise<void>(resolve => setTimeout(() => resolve(), 4100));

            if (!monitor.connectedModems.size) {

                console.log("No USB dongles currently connected.");

            }

            for (let accessPoint of monitor.connectedModems) {

                for (let device_path of [accessPoint.audioIfPath, accessPoint.dataIfPath]) {

                    scriptLib.execSync(`chown root:${unix_user} ${device_path}`);

                    scriptLib.execSync(`chmod u+rw,g+rw,o+rw ${device_path}`);

                }


            }

        })();

    }

    export function remove() {

        scriptLib.execSyncQuiet(`rm -rf ${rules_path}`);

        scriptLib.execSyncQuiet("systemctl restart udev.service");

    }

}

async function apt_get_install_asterisk() {

    if (
        scriptLib.apt_get_install_if_missing.doesHaveProg("asterisk") &&
        !scriptLib.apt_get_install_if_missing.isPkgInstalled("asterisk")
    ) {

        //Custom install, we do not install from repositories.
        return;

    }

    if (!scriptLib.apt_get_install_if_missing.isPkgInstalled("asterisk")) {

        //If asterisk is not installed make sure asterisk-config is purged so the config files will be re-generated.
        scriptLib.execSyncQuiet("dpkg -P asterisk-config");

    }

    const pr_install_ast = scriptLib.apt_get_install_if_missing("asterisk-dev");

    //HOTFIX: On old version of raspberry pi install crash because timeout is reached.

    const service_path = "/lib/systemd/system/asterisk.service";

    const watcher = fs.watch(path.dirname(service_path), (event, filename) => {

        if (
            event === 'rename' &&
            filename === path.basename(service_path) &&
            fs.existsSync(service_path)
        ) {

            fs.writeFileSync(service_path,
                Buffer.from(
                    fs.readFileSync(service_path).toString("utf8").replace(
                        "\n[Service]\n", "\n[Service]\nTimeoutSec=infinity\n"
                    ),
                    "utf8"
                )
            );

            scriptLib.execSync("systemctl daemon-reload");

        }

    });

    await pr_install_ast;

    watcher.close();

}

namespace modemManager {

    export function disable_and_stop() {

        try {

            scriptLib.execSyncQuiet("systemctl stop ModemManager");

            console.log(scriptLib.colorize([
                "ModemManager was previously managing dongles on this host, is has been disabled. ",
                "You need to disconnect and reconnect your GSM dongles"
            ].join("\n"), "YELLOW"));

        } catch{ }

        try {

            scriptLib.execSyncQuiet("systemctl disable ModemManager");

        } catch{ }

    }

    export function enable_and_start() {

        try {

            scriptLib.execSyncQuiet("systemctl enable ModemManager");

        } catch{ }

        try {

            scriptLib.execSyncQuiet("systemctl start ModemManager");

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

            scriptLib.execSyncQuiet(`which virtualenv`);

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

export function build_ast_cmdline(): string {

    const { ld_library_path_for_asterisk, asterisk_main_conf } = InstallOptions.get();
    const { astsbindir } = Astdirs.get();

    return `LD_LIBRARY_PATH=${ld_library_path_for_asterisk} ${path.join(astsbindir, "asterisk")} -C ${asterisk_main_conf}`;

}

async function rebuild_node_modules() {

    const { exec, onSuccess } = scriptLib.start_long_running_process("Building node_modules dependencies");

    await (async function build_udev() {

        const udev_dir_path = scriptLib.find_module_path("udev", module_dir_path);

        if (fs.existsSync(path.join(udev_dir_path, "build"))) {
            return;
        }

        let pre_gyp_dir_path = "";

        for (const _module_dir_path of [udev_dir_path, module_dir_path]) {

            try {

                pre_gyp_dir_path = scriptLib.find_module_path("node-pre-gyp", _module_dir_path);

                break;

            } catch{ }

        }

        await exec(
            [
                `PATH=${path.join(module_dir_path)}:$PATH`,
                `${path.basename(node_path)} ${path.join(pre_gyp_dir_path, "bin", "node-pre-gyp")} install`,
                "--fallback-to-build"
            ].join(" "),
            { "cwd": udev_dir_path }
        );

    })();

    await (async function postinstall_node_python_messaging() {

        const node_python_messaging_dir_path = scriptLib.find_module_path(
            "node-python-messaging", module_dir_path
        );

        if (fs.existsSync(path.join(node_python_messaging_dir_path, "dist", "virtual"))) {
            return;
        }

        await exec(
            "./install-python-dep.sh",
            { "cwd": node_python_messaging_dir_path }
        );

    })();

    onSuccess("DONE");

}

if (require.main === module) {

    process.once("unhandledRejection", error => { throw error; });

    scriptLib.exit_if_not_root();

    scriptLib.apt_get_install.onInstallSuccess = package_name =>
        scriptLib.apt_get_install.record_installed_package(installed_pkg_record_path, package_name);

    import("commander").then(program => {

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

        _install.action(options => program_action_install(options));

        program
            .command("uninstall")
            .action(() => program_action_uninstall())
            ;

        program
            .command("update")
            .option(`--path [{path}]`)
            .action(options => program_action_update(options))
            ;

        program
            .command("tarball")
            .action(() => program_action_tarball())
            ;


        program.parse(process.argv);

    });

}

