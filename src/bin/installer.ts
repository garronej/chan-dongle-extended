#!/usr/bin/env node

require("rejection-tracker").main(__dirname, "..", "..");

import * as program from "commander";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { apt_get_install } from "./apt_get_installer";

import * as localsManager from "../lib/localsManager";

import "colors";

const node_path = process.argv[0];
const module_path = path.join(__dirname, "..", "..");

let [cli_path, main_path] = (() => {

    let bind_dir_path = path.join(module_path, "dist", "bin");

    return [
        path.join(bind_dir_path, "cli.js"),
        path.join(bind_dir_path, "main.js")
    ];

})();

const working_directory_path = path.join(module_path, "working_directory");

let _install = program.command("install").description("install");

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

    if (fs.existsSync(working_directory_path)) {

        console.log("already installed".red);

        process.exit(-1);

    }

    let locals: localsManager.Locals = { ...localsManager.Locals.defaults };


    for (let key in localsManager.Locals.defaults) {

        if (options[key] !== undefined) {
            locals[key] = options[key];
        }

    }

    locals.build_across_linux_kernel= `${execSync("uname -r")}`;

    //@ts-ignore
    let { astetcdir, astsbindir, astmoddir, astrundir } = localsManager.get.readAstdirs(locals.astetcdir);

    unixUser.create(locals.service_name);

    workingDirectory.create(locals.service_name);

    (() => {

        let local_path = path.join(working_directory_path, localsManager.file_name);

        fs.writeFileSync(
            local_path,
            Buffer.from(JSON.stringify(locals, null, 2), "utf8")
        );

        execSync(`chown ${locals.service_name}:${locals.service_name} ${local_path}`);

    })();

    tty0tty.install();

    await udevRules.create(locals.service_name);

    createShellScripts(locals.service_name, astsbindir);

    systemd.create(locals.service_name);

    grantDongleConfigFileAccess(astetcdir, locals.service_name);

    await enableAsteriskManager(
        locals.service_name, astetcdir, locals.ami_port, astsbindir, astrundir
    );

    console.log("---DONE---");

    process.exit(0);

});

program
    .command("uninstall")
    .action(async () => {

        console.log("---Uninstalling chan-dongle-extended---");

        let { locals } = localsManager.get(working_directory_path);

        try {

            process.stdout.write("Stopping service ... ");

            execSync(`systemctl stop ${locals.service_name}`);

            console.log("ok".green);

        } catch ({ message }) {

            console.log(message.red);

        }

        try {

            execSync(`pkill -u ${locals.service_name}`);

        } catch{ }


        try {

            process.stdout.write("Removing cli tool symbolic link ... ");

            execSync(`rm $(which ${locals.service_name})`);

            console.log("ok".green);

        } catch ({ message }) {

            console.log(message.red);

        }

        try {

            process.stdout.write("Removing systemd service ... ");

            systemd.remove(locals.service_name);;

            console.log("ok".green);

        } catch ({ message }) {

            console.log(message.red);

        }

        try {

            process.stdout.write("Removing udev rules ... ");

            udevRules.remove(locals.service_name);

            console.log("ok".green);

        } catch ({ message }) {

            console.log(message.red);

        }

        try{

            process.stdout.write("Removing tty0tty kernel module ...");

            tty0tty.remove();

            console.log(`${"ok".green} ( need reboot )`);

        }catch({ message }){

            console.log(message.red);

        }

        try {

            process.stdout.write("Removing app working directory ... ");

            workingDirectory.remove();

            console.log("ok".green);

        } catch ({ message }) {

            console.log(message.red);

        }

        try {

            process.stdout.write("Deleting unix user ... ");

            unixUser.remove(locals.service_name);

            console.log("ok".green);

        } catch ({ message }) {

            console.log(message.red);

        }

        console.log("---DONE---");

        process.exit(0);

    });

namespace tty0tty {

    const load_module_file_path = "/etc/modules";

    export function install() {

        process.stdout.write("Checking for linux kernel headers ...");

        try {

            execSync("ls /lib/modules/$(uname -r)/build 2>/dev/null");

            console.log("found, OK".green);

        } catch{

            process.stdout.write("not found ...");

            try {

                console.assert(!!`${execSync("cat /etc/os-release")}`.match(/^NAME=.*Raspbian.*$/m));

                apt_get_install(`raspberrypi-kernel-headers`);

            } catch{

                apt_get_install(`linux-headers-$(uname -r)`);

            }

        }

        apt_get_install("git", "git");

        console.log("Building and installing tty0tty kernel module >>>");

        try {

            const tty0tty_dir_path = path.join(working_directory_path, "tty0tty");

            const tty0tty_module_dir_path = path.join(tty0tty_dir_path, "module");

            execSync(`git clone https://github.com/garronej/tty0tty ${tty0tty_dir_path}`);

            execSync(`make --directory=${tty0tty_module_dir_path}`);

            execSync(`cp ${path.join(tty0tty_module_dir_path, "tty0tty.ko")} /lib/modules/$(uname -r)/kernel/drivers/misc/`);

            execSync("depmod");

            execSync("modprobe tty0tty");

            try {

                execSync(`cat ${load_module_file_path} | grep tty0tty`);

            } catch {

                execSync(`echo tty0tty >> ${load_module_file_path}`);

            }

        } catch ({ message }) {

            console.log(message.red);

            process.exit(-1);

        }

        console.log("<<< tty0tty successfully installed".green);

    }

    export function remove() {

        fs.writeFileSync(
            load_module_file_path,
            Buffer.from(
                `${fs.readFileSync(load_module_file_path)}`.replace("tty0tty", ""),
                "utf8"
            )
        );

        execSync(`rm -f /lib/modules/$(uname -r)/kernel/drivers/misc/tty0tty.ko`);

    }

}


namespace workingDirectory {

    export function create(service_name: string) {

        process.stdout.write(`Creating app working directory '${working_directory_path}' ... `);

        execSync(`mkdir ${working_directory_path}`);

        execSync(`chown ${service_name}:${service_name} ${working_directory_path}`);

        console.log("ok".green);
    }

    export function remove() {

        execSync(`rm -r ${working_directory_path}`);

    }

}

namespace unixUser {

    export function create(service_name: string) {

        process.stdout.write(`Creating unix user '${service_name}' ... `);

        execSync(`useradd -M ${service_name} -s /bin/false -d ${working_directory_path}`);

        console.log("ok".green);

    }

    export function remove(service_name: string) {


        execSync(`userdel ${service_name}`);

    }

}

function grantDongleConfigFileAccess(astetcdir: string, service_name: string): void {

    let dongle_path = path.join(astetcdir, "dongle.conf");

    process.stdout.write(`Granting write access to ${service_name} on '${dongle_path}' ... `);

    execSync(`touch ${dongle_path}`);

    execSync(`chown ${service_name}:${service_name} ${dongle_path}`);

    execSync(`chmod u+rw ${dongle_path}`);

    console.log("ok".green);

}

function createShellScripts(service_name: string, astsbindir: string): void {

    process.stdout.write(`Creating launch scripts ... `);

    const writeAndSetPerms = (script_path: string, script: string): void => {

        fs.writeFileSync(script_path, Buffer.from(script, "utf8"));

        execSync(`chown ${service_name}:${service_name} ${script_path}`);

        execSync(`chmod +x ${script_path}`);

    };

    createShellScripts.wait_ast_sh_path = path.join(working_directory_path, "wait_ast.sh");

    writeAndSetPerms(
        createShellScripts.wait_ast_sh_path,
        [
            `#!/usr/bin/env bash`,
            ``,
            `until ${path.join(astsbindir, "asterisk")} -rx "core waitfullybooted"`,
            `do`,
            `   sleep 3`,
            `done`,
            `pkill -u ${service_name} || true`,
            ``
        ].join("\n")
    );

    let cli_sh_path = path.join(working_directory_path, "cli.sh");

    writeAndSetPerms(
        cli_sh_path,
        [
            `#!/usr/bin/env bash`,
            ``,
            `cd ${working_directory_path}`,
            `args=""`,
            `for param in "$@"`,
            `do`,
            `   args="$args \\"$param\\""`,
            `done`,
            `sudo su -s $(which bash) -c "${node_path} ${cli_path} $args" ${service_name}`,
            ``
        ].join("\n")
    );

    execSync(`ln -s ${cli_sh_path} ${path.join(astsbindir, service_name)}`);

    writeAndSetPerms(
        path.join(working_directory_path, "main.sh"),
        [
            `#!/usr/bin/env bash`,
            ``,
            `systemctl stop ${service_name}`,
            `cd ${working_directory_path}`,
            `args=$@`,
            `${createShellScripts.wait_ast_sh_path}`,
            `su -s $(which bash) -c "${node_path} ${main_path} $args" ${service_name}`,
            ``
        ].join("\n")
    );

    console.log("ok".green);

}

namespace createShellScripts {

    export let wait_ast_sh_path: string;

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
            `ExecStartPre=${createShellScripts.wait_ast_sh_path}`,
            `ExecStart=${node_path} ${main_path}`,
            `Environment=NODE_ENV=production`,
            `PermissionsStartOnly=true`,
            `StandardOutput=journal`,
            `WorkingDirectory=${working_directory_path}`,
            `Restart=always`,
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

        console.log("ok".green);

    }

    export function remove(service_name: string) {

        try {

            execSync(`systemctl disable ${service_name} --quiet`);

            fs.unlinkSync(get_service_path(service_name));

        } catch{ }

        execSync("systemctl daemon-reload");

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

    execSync(`chmod +r ${manager_path}`);

    if (fs.existsSync(path.join(astrundir, "asterisk.ctl"))) {

        execSync(`${path.join(astsbindir, "asterisk")} -rx "core reload"`);

    }

    console.log("ok".green);

}

namespace udevRules {

    function make_rules_path(service_name): string {
        return path.join("/etc/udev/rules.d", `98-${service_name}.rules`);
    }

    export async function create(
        service_name: string
    ) {

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
            `MODE="0660"`,
            `GROUP="${service_name}"`
        ].join(", ") + `\n`;

        fs.writeFileSync(rules_path, rules);

        execSync("systemctl restart udev.service");

        console.log("ok".green);

        execSync(`chown ${service_name}:${service_name} ${rules_path}`);

        execSync(`chown root:${service_name} /dev/tnt*`);

        execSync("chmod u+rw,g+rw /dev/tnt*");

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

        execSync(`rm -rf ${rules_path}`);

        execSync("systemctl restart udev.service");

    }

}

program.parse(process.argv);