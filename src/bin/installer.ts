#!/usr/bin/env node

require("rejection-tracker").main(__dirname, "..", "..");

import * as program from "commander";
import * as child_process from "child_process";
const execSync = (cmd: string) => child_process.execSync(cmd).toString("utf8");
const execSyncSilent = (cmd: string) => child_process.execSync(cmd, { "stdio": [] }).toString("utf8");

import * as fs from "fs";
import * as path from "path";
import * as scriptLib from "../tools/scriptLib";
import * as readline from "readline";

import * as localsManager from "../lib/localsManager";
import * as cli from "./cli";

import { 
    module_dir_path, pkg_list_path
} from "./install_prereq";

scriptLib.exit_if_not_root();

const [cli_js_path, main_js_path] = [
    "cli.js", "main.js"
].map(f => path.join(module_dir_path, "dist", "bin", f));
const working_directory_path = path.join(module_dir_path, "working_directory");
const stop_sh_path = path.join(working_directory_path, "stop.sh");
const wait_ast_sh_path = path.join(working_directory_path, "wait_ast.sh");
const node_path = path.join(working_directory_path, "node");

let _install = program.command("install");

for (let key in localsManager.Locals.defaults) {

    let value = localsManager.Locals.defaults[key];

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

    scriptLib.apt_get_install.onInstallSuccess = package_name => 
        scriptLib.apt_get_install.record_installed_package(pkg_list_path, package_name);

    if( options["astetcdir"] === undefined ){

        await apt_get_install_asterisk();

    }

    let locals: localsManager.Locals = { ...localsManager.Locals.defaults };

    for (let key in localsManager.Locals.defaults) {

        if (options[key] !== undefined) {
            locals[key] = options[key];
        }

    }

    locals.build_across_linux_kernel = `${execSync("uname -r")}`;

    try {

        var astdirs = localsManager.get.readAstdirs(locals.astetcdir);

    } catch ({ message }) {

        console.log(scriptLib.colorize(`Failed to parse asterisk.conf: ${message}`, "RED"));

        process.exit(-1);

        return;

    }

    execSync(`chmod u+r,g+r,o+r ${path.join(astdirs.astetcdir, "asterisk.conf")}`);

    if (fs.existsSync(working_directory_path)) {

        process.stdout.write(scriptLib.colorize("Already installed, erasing previous install... ", "YELLOW"));

        await uninstall(locals, astdirs);

        console.log("DONE");

    } else {

        execSyncSilent(`pkill -u ${locals.service_name} -SIGUSR2 || true`);

    }

    try {

        await install(locals, astdirs);

    } catch{

        process.stdout.write(scriptLib.colorize("Rollback install ...", "YELLOW"));

        await uninstall(locals, astdirs);

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

        try {

            var { locals, astdirs } = localsManager.get(working_directory_path);

        } catch(error){

            console.log(error.message);

            console.log(scriptLib.colorize("Not installed", "YELLOW"));

            process.exit(0);

            return;

        }

        uninstall(locals, astdirs, "VERBOSE");

        console.log("---DONE---");

        if( fs.existsSync(pkg_list_path) ){

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

async function install(
    locals: localsManager.Locals, 
    astdirs: localsManager.Astdirs
) {

    const { astetcdir, astsbindir, astmoddir, astrundir } = astdirs;

    modemManager.disable_and_stop();

    await scriptLib.apt_get_install("usb-modeswitch", "usb_modeswitch");

    unixUser.create(locals.service_name);

    workingDirectory.create(locals.service_name);

    execSync(`cp $(readlink -e ${process.argv[0]}) ${node_path}`);

    (() => {

        let local_path = path.join(working_directory_path, localsManager.file_name);

        fs.writeFileSync(
            local_path,
            Buffer.from(JSON.stringify(locals, null, 2), "utf8")
        );

        execSync(`chown ${locals.service_name}:${locals.service_name} ${local_path}`);

    })();

    await tty0tty.install();

    if (locals.assume_chan_dongle_installed) {

        console.log(scriptLib.colorize("Assuming chan_dongle already installed.", "YELLOW"));

        chan_dongle.chownConfFile(astetcdir, locals.service_name);

    } else {

        await chan_dongle.install(astsbindir, locals.ast_include_dir_path, astmoddir, astetcdir, locals.service_name);

    }

    await udevRules.create(locals.service_name);

    shellScripts.create(locals.service_name, astsbindir);

    systemd.create(locals.service_name);

    await enableAsteriskManager(
        locals.service_name, astetcdir, locals.ami_port, astsbindir, astrundir
    );

}

function uninstall(
    locals: localsManager.Locals,
    astdirs: localsManager.Astdirs,
    verbose?: "VERBOSE" | undefined
) {

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

    if (locals.assume_chan_dongle_installed) {

        log("Skipping uninstall of chan_dongle.so as it was installed separately");

    } else {

        runRecover("Uninstalling chan_dongle.so ... ", () => chan_dongle.remove(astdirs.astmoddir, astdirs.astsbindir));

    }

    runRecover("Removing binary symbolic links ... ", ()=> shellScripts.remove_symbolic_links(locals.service_name));

    runRecover("Removing systemd service ... ", () => systemd.remove(locals.service_name));

    runRecover("Removing udev rules ... ", () => udevRules.remove(locals.service_name));

    runRecover("Removing tty0tty kernel module ...", () => tty0tty.remove());

    runRecover("Removing app working directory ... ", () => workingDirectory.remove());

    runRecover("Deleting unix user ... ", () => unixUser.remove(locals.service_name));

    runRecover("Re enabling ModemManager if present...", ()=> modemManager.enable_and_start());

}

namespace tty0tty {

    const h_dir_path = path.join(working_directory_path, "linux-headers");

    const build_link_path = `/lib/modules/$(uname -r)/build`;

    async function remove_local_linux_headers() {

        try {

            await scriptLib.showLoad.exec(`rm -r ${h_dir_path} 2>/dev/null`, () => { });

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

            await scriptLib.apt_get_install(`linux-headers-$(uname -r)`);

            return;

        }

        let h_deb_path = path.join(working_directory_path, "linux-headers.deb");


        await (async function download_deb() {

            let { onSuccess, onError } = scriptLib.showLoad("Downloading raspberrypi linux headers");

            const wget = (url: string) => scriptLib.showLoad.exec(`wget ${url} -O ${h_deb_path}`, () => { });

            try {

                let firmware_release = execSync("zcat /usr/share/doc/raspberrypi-bootloader/changelog.Debian.gz | head")
                    .match(/^[^r]*raspberrypi-firmware\ \(([^\)]+)\)/)![1]
                    ;

                let url = [
                    "https://archive.raspberrypi.org/debian/pool/main/r/raspberrypi-firmware/",
                    `raspberrypi-kernel-headers_${firmware_release}_armhf.deb`
                ].join("");

                await wget(url);

            } catch{

                try {

                    let url = [
                        "https://www.niksula.hut.fi/~mhiienka/Rpi/linux-headers-rpi" + (kernel_release[0] === "3" ? "/3.x.x/" : "/"),
                        `linux-headers-${kernel_release}_${kernel_release}-2_armhf.deb`
                    ].join("");

                    await wget(url);

                } catch{

                    onError("linux-kernel headers for raspberry pi not found");

                    throw new Error()

                }

            }

            onSuccess("DONE");


        }());

        await (async function install_deb() {

            let { onSuccess, onError } = scriptLib.showLoad("Installing linux headers");

            await scriptLib.showLoad.exec(`dpkg -x ${h_deb_path} ${h_dir_path}`, onError);

            await scriptLib.showLoad.exec(`rm ${h_deb_path}`, onError);

            let build_dir_path = path.join(h_dir_path, "usr", "src", `linux-headers-${kernel_release}`);

            execSync(`mv ${path.join(h_dir_path, "usr", "src", kernel_release)} ${build_dir_path} 2>/dev/null || true`);

            execSync(`ln -sf ${build_dir_path} ${build_link_path}`);

            onSuccess("DONE");


        })();


    }

    const load_module_file_path = "/etc/modules";

    export async function install() {

        await install_linux_headers();

        await scriptLib.apt_get_install("git", "git");

        let { onSuccess, onError } = scriptLib.showLoad("Building and installing tty0tty kernel module");

        const tty0tty_dir_path = path.join(working_directory_path, "tty0tty");

        const exec = (cmd: string) => scriptLib.showLoad.exec(cmd, onError);
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

    let chan_dongle_dir_path = path.join(working_directory_path, "asterisk-chan-dongle");

    export function chownConfFile(astetcdir: string, service_name: string): void {

        let dongle_path = path.join(astetcdir, "dongle.conf");

        execSync(`touch ${dongle_path}`);

        execSync(`chown ${service_name}:${service_name} ${dongle_path}`);

        execSync(`chmod u+rw,g+r,o+r ${dongle_path}`);

    }

    export async function install(
        astsbindir: string,
        ast_include_dir_path: string,
        astmoddir: string,
        astetcdir: string,
        service_name: string
    ) {

        await scriptLib.apt_get_install("automake");

        let { onSuccess, onError } = scriptLib.showLoad(
            `Building and installing asterisk chan_dongle ( may take several minutes )`
        );

        let ast_ver = execSync(`${path.join(astsbindir, "asterisk")} -V`)
            .match(/^Asterisk\s+([0-9\.]+)/)![1]
            ;

        const exec = (cmd: string) => scriptLib.showLoad.exec(cmd, onError);
        const cdExec = (cmd: string) => exec(`(cd ${chan_dongle_dir_path} && ${cmd})`);

        await exec(`git clone https://github.com/garronej/asterisk-chan-dongle ${chan_dongle_dir_path}`);

        await cdExec("./bootstrap");

        await cdExec(`./configure --with-astversion=${ast_ver} --with-asterisk=${ast_include_dir_path}`);

        await cdExec("make");

        await cdExec(`cp chan_dongle.so ${astmoddir}`);

        chownConfFile(astetcdir, service_name);

        onSuccess("OK");

    }

    export function remove(astmoddir: string, astsbindir: string) {

        try {

            execSyncSilent(`${path.join(astsbindir, "asterisk")} -rx "module unload chan_dongle.so"`);

        } catch{ }

        execSyncSilent(`rm -f ${path.join(astmoddir, "chan_dongle.so")}`);

    }

}

namespace workingDirectory {

    export function create(service_name: string) {

        process.stdout.write(`Creating app working directory '${working_directory_path}' ... `);

        execSync(`mkdir ${working_directory_path}`);

        (()=>{

            const cli_storage_path = path.join(working_directory_path, cli.storage_path);

            execSync(`mkdir ${cli_storage_path}`);

            execSync(`chmod 777 ${cli_storage_path}`);

        })();

        execSync(`chown -R ${service_name}:${service_name} ${working_directory_path}`);

        console.log(scriptLib.colorize("OK", "GREEN"));
    }

    export function remove() {

        execSyncSilent(`rm -r ${working_directory_path}`);

    }

}

namespace unixUser {

    export function create(service_name: string) {

        process.stdout.write(`Creating unix user '${service_name}' ... `);

        execSyncSilent(`pkill -u ${service_name} -SIGUSR2 || true`);

        execSyncSilent(`userdel ${service_name} || true`);

        execSync(`useradd -M ${service_name} -s /bin/false -d ${working_directory_path}`);

        /*
        try{

            execSyncSilent(`usermod -G ${service_name} asterisk`);

        }catch{}
        */

        console.log(scriptLib.colorize("OK", "GREEN"));

    }

    export function remove(service_name: string) {

        execSyncSilent(`userdel ${service_name}`);

    }

}

namespace shellScripts {
    
    const get_cli_link_path= (service_name: string)=> path.join("/usr/bin", service_name);
    const get_uninstaller_link_path= (service_name: string)=> path.join("/usr/sbin", `${service_name}_uninstaller`);

    export function create(service_name: string, astsbindir: string): void {

    process.stdout.write(`Creating launch scripts ... `);

    const writeAndSetPerms = (script_path: string, script: string): void => {

        fs.writeFileSync(script_path, Buffer.from(script, "utf8"));

        execSync(`chown ${service_name}:${service_name} ${script_path}`);

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
            `pkill -u ${service_name} -SIGUSR2 || true`,
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
            `until ${path.join(astsbindir, "asterisk")} -rx "core waitfullybooted"`,
            `do`,
            `   sleep 3`,
            `done`,
            ``
        ].join("\n")
    );

    let cli_sh_path = path.join(working_directory_path, "cli.sh");

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

    execSync(`ln -sf ${cli_sh_path} ${get_cli_link_path(service_name)}`);

    let uninstaller_sh_path = path.join(working_directory_path, "uninstaller.sh");

    writeAndSetPerms(
        uninstaller_sh_path,
        [
            `#!/usr/bin/env bash`,
            ``,
            `# Will uninstall the service and remove source if installed from tarball`,
            ``,
            `${node_path} ${__filename} uninstall`,
            fs.existsSync(path.join(module_dir_path, ".git"))?``:`rm -r ${module_dir_path}`,
            ``
        ].join("\n")
    );

    execSync(`ln -sf ${uninstaller_sh_path} ${get_uninstaller_link_path(service_name)}`);

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
            `su -s $(which bash) -c "${node_path} ${main_js_path}" ${service_name}`,
            ``
        ].join("\n")
    );

    console.log(scriptLib.colorize("OK", "GREEN"));


    }

    export function remove_symbolic_links(service_name: string){

        execSyncSilent(
            `rm -f ${get_cli_link_path(service_name)} ${get_uninstaller_link_path(service_name)}`
        );

    }

}


namespace systemd {

    function get_service_path(service_name: string): string {
        return path.join("/etc/systemd/system", `${service_name}.service`);
    }

    export function create(service_name: string): void {

        let service_path = get_service_path(service_name);

        process.stdout.write(`Creating systemd service ${service_path} ... `);

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
            `User=${service_name}`,
            `Group=${service_name}`,
            ``,
            `[Install]`,
            `WantedBy=multi-user.target`,
            ``
        ].join("\n");

        fs.writeFileSync(service_path, Buffer.from(service, "utf8"));

        execSync("systemctl daemon-reload");

        execSync(`systemctl enable ${service_name} --quiet`);

        execSync(`systemctl start ${service_name}`);

        console.log(scriptLib.colorize("OK", "GREEN"));

    }

    export function remove(service_name: string) {

        try {

            execSyncSilent(`systemctl disable ${service_name} --quiet`);

            fs.unlinkSync(get_service_path(service_name));

        } catch{ }

        execSyncSilent("systemctl daemon-reload");

    }

}

async function enableAsteriskManager(
    service_name: string,
    astetcdir: string,
    ami_port: number,
    astsbindir: string,
    astrundir: string
) {


    process.stdout.write(`Enabling asterisk manager on port ${ami_port} ... `);

    const [
        { ini }, { misc }
    ] = await Promise.all([
        import("ini-extended"),
        import("../chan-dongle-extended-client"),
    ]);

    const manager_path = path.join(astetcdir, "manager.conf");

    let general = {
        "enabled": "yes",
        "port": `${ami_port}`,
        "bindaddr": "127.0.0.1",
        "displayconnects": "yes"
    };

    let does_file_exist = false;

    if (fs.existsSync(manager_path)) {

        does_file_exist = true;

        try {

            general = ini.parseStripWhitespace(
                fs.readFileSync(manager_path).toString("utf8")
            ).general;

            general.enabled = "yes";

            general.port = `${ami_port}`;

        } catch{ }

    }

    let ami_user_conf = {
        "secret": `${Date.now()}`,
        "deny": "0.0.0.0/0.0.0.0",
        "permit": "0.0.0.0/0.0.0.0",
        "read": "all",
        "write": "all",
        "writetimeout": "5000"
    };

    fs.writeFileSync(
        manager_path,
        Buffer.from(ini.stringify({ general, [misc.amiUser]: ami_user_conf }), "utf8")
    );

    if (!does_file_exist) {

        execSync(`chown ${service_name}:${service_name} ${manager_path}`);

    }

    execSync(`chmod u+r,g+r,o+r ${manager_path}`);

    if (fs.existsSync(path.join(astrundir, "asterisk.ctl"))) {

        try {

            execSyncSilent(`${path.join(astsbindir, "asterisk")} -rx "core reload"`);

        } catch{ }

    }

    console.log(scriptLib.colorize("OK", "GREEN"));

}

namespace udevRules {

    function make_rules_path(service_name): string {
        return path.join("/etc/udev/rules.d", `98-${service_name}_disable_net_and_grant_access.rules`);
    }

    export async function create(
        service_name: string
    ) {

        //NOTE: we could grant access only to "dongle" group as asterisk is added to this group but need restart ast...

        let rules_path = make_rules_path(service_name);

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
                `GROUP="${service_name}"`
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
            `GROUP="${service_name}"`
        ].join(", ") + `\n`;

        fs.writeFileSync(rules_path, rules);

        execSync("systemctl restart udev.service");

        console.log(scriptLib.colorize("OK", "GREEN"));

        execSync(`chown ${service_name}:${service_name} ${rules_path}`);

        execSync(`chown root:${service_name} /dev/tnt*`);

        execSync("chmod u+rw,g+rw,o+rw /dev/tnt*");

        await (async () => {

            let monitor = ConnectionMonitor.getInstance();

            console.log("Detecting currently connected modems ... ");

            await new Promise<void>(resolve => setTimeout(() => resolve(), 4100));

            if (!monitor.connectedModems.size) {

                console.log("No modems currently connected.");

            }

            for (let accessPoint of monitor.connectedModems) {

                for (let device_path of [accessPoint.audioIfPath, accessPoint.dataIfPath]) {

                    execSync(`chown root:${service_name} ${device_path}`);

                    execSync(`chmod u+rw,g+rw,o+rw ${device_path}`);

                }


            }

        })();

    }

    export function remove(service_name: string) {

        let rules_path = make_rules_path(service_name);

        execSyncSilent(`rm -rf ${rules_path}`);

        execSyncSilent("systemctl restart udev.service");

    }

}

async function apt_get_install_asterisk() {

    if( !scriptLib.apt_get_install.isPkgInstalled("asterisk") ){

        execSyncSilent("dpkg -P asterisk-config");

    }

    let pr_install_ast = scriptLib.apt_get_install("asterisk-dev", "asterisk");

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

    export function disable_and_stop(){

        try{

            execSyncSilent("systemctl stop ModemManager");

            console.log("ModemManager.service stopped, you will need to unplug and reconnect your dongle");

        }catch{}

        try{

            execSyncSilent("systemctl disable ModemManager");

            console.log("ModemManager.service disabled");

        }catch{}

    }

    export function enable_and_start(){

        try{

            execSyncSilent("systemctl enable ModemManager");

        }catch{}

        try{

            execSyncSilent("systemctl start ModemManager");

        }catch{}

    }

}

program.parse(process.argv);
