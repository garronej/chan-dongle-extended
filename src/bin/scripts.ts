#!/usr/bin/env node

import * as path from "path";
const modulePath = path.join(__dirname, "..", "..");
const systemdServicePath = path.join("/etc", "systemd", "system", "dongle-extended.service");
const udevRulesPath = path.join("/etc", "udev", "rules.d", "99-dongle-extended.rules");
const astConfPath= path.join("/etc", "asterisk");
const dongleConfPath= path.join(astConfPath, "dongle.conf");
const managerConfPath= path.join(astConfPath, "manager.conf");

require("rejection-tracker").main(modulePath);

import { exec } from "child_process";
import * as readline from "readline";
import { readFileSync, writeFile, unlinkSync, existsSync } from "fs";
import * as program from "commander";
import { recordIfNum } from "gsm-modem-connection";
const vendorIds = Object.keys(recordIfNum);
import { ini } from "ini-extended";
import { chanDongleConfManager } from "../lib/chanDongleConfManager";
import "colors";
import { amiUser } from "../_chan-dongle-extended-client";



program
    .command("postinstall")
    .description([
        "Checks that Asterisk and chan_dongle and tty0tty are installed",
        "Create udev rules for granting R/W access on dongles on connect",
        "and disable the wwan network interface created by the dongles",
        "Enable Asterisk Manager and create a user for this module",
        "Register a systemd service: dongle-extended.service"
    ].join(" "))
    .action(async () => {

        await checkDependencies();
        await setUdevRules();
        await enableManager();
        await mkPersistDir();
        await installService();

        process.exit(0);

    });

program
    .command("prestart")
    .description("Reset chan_dongle, give perms to dev/tnt* devices (tty0tty)")
    .action(async () => {

        await resetChanDongle();
        await grantAccessTntDevices();

        process.exit(0);

    });

program
    .command("poststop")
    .description("Reset chan_dongle")
    .action(async () => {

        await resetChanDongle()

        process.exit(0);

    });

program
    .command("preuninstall")
    .description("Remove systemd service, remove udev rules")
    .action(async () => {

        await removeService();
        await removeUdevRules();

        process.exit(0);

    });

program.parse(process.argv);

async function installService() {

    const node_execpath = process.argv[0];

    console.log([
        "Now you will be ask to choose the user that will run the service\n",
    ].join("").yellow);

    const user = (await ask("User? (press enter for root)")) || "root";

    const group = (await ask("Group? (press enter for root)")) || "root";

    let service = [
        `[Unit]`,
        `Description=chan dongle extended service`,
        `After=network.target`,
        ``,
        `[Service]`,
        `ExecStartPre=${node_execpath} ${__filename} prestart`,
        `ExecStart=${node_execpath} ${modulePath}/dist/lib/main`,
        `ExecStopPost=${node_execpath} ${__filename} poststop`,
        `PermissionsStartOnly=true`,
        `WorkingDirectory=${modulePath}`,
        `Restart=always`,
        `RestartSec=10`,
        `StandardOutput=syslog`,
        `StandardError=syslog`,
        `SyslogIdentifier=DongleExt`,
        `User=${user}`,
        `Group=${group}`,
        `Environment=NODE_ENV=production DEBUG=_*`,
        ``,
        `[Install]`,
        `WantedBy=multi-user.target`,
        ``
    ].join("\n");

    await writeFileAssertSuccess(systemdServicePath, service);

    await run("systemctl daemon-reload");

    console.log([
        `Chan dongle extended service installed!`.green,
        `${systemdServicePath}: \n\n ${service}`,
        `To run the service:`.yellow,
        `sudo systemctl start dongle-extended`,
        `To automatically start the service on boot:`.yellow,
        `sudo systemctl enable dongle-extended`,
    ].join("\n"));

}

async function mkPersistDir() {


    let pathPersist = path.join(modulePath, ".node-persist");

    await run(`mkdir -p ${pathPersist}`);

    await run(`chmod 777 ${pathPersist}`);

    console.log("Persist dir created");

}

async function enableManager() {


    let general = {
        "enabled": "yes",
        "port": "5038",
        "bindaddr": "127.0.0.1",
        "displayconnects": "yes"
    };


    let user = {
        "secret": `${Date.now()}`,
        "deny": "0.0.0.0/0.0.0.0",
        "permit": "0.0.0.0/0.0.0.0",
        //"read": "system,user,config,agi",
        "read": "all",
        //"write": "system,user,config,agi",
        "write": "all",
        "writetimeout": "5000"
    };


    if (existsSync(managerConfPath)) {
        try {
            general = ini.parseStripWhitespace(readFileSync(managerConfPath, "utf8")).general;
            general.enabled = "yes";
        } catch (error) { }
    }

    await writeFileAssertSuccess(
        managerConfPath,
        ini.stringify(
            (() => {

                let out: any = { general };

                out[amiUser] = user;

                return out;

            })()
        )
    );

    await run(`chmod u+r,g+r,o+r ${managerConfPath}`);

    try {

        await run('asterisk -rx "core reload"');

    } catch (error) { }

    console.log("Asterisk Manager successfully enabled");

}

async function setUdevRules() {

    let rules = "# Automatically generated by chan-dongle-extended.\n\n";

    for (let vendorId of vendorIds) {

        rules += [
            `ACTION=="add"`,
            `ENV{ID_VENDOR_ID}=="${vendorId}"`,
            `ENV{SUBSYSTEM}=="tty"`,
            `ENV{ID_USB_INTERFACE_NUM}=="[0-9]*"`,
            `MODE="0666"`,
            `GROUP="root"`
        ].join(", ") + `\n`;

        rules += [
            `ACTION=="add"`,
            `ENV{ID_VENDOR_ID}=="${vendorId}"`,
            `ENV{SUBSYSTEM}=="net"`,
            `ENV{ID_USB_INTERFACE_NUM}=="[0-9]*"`,
            `RUN+="/bin/sh -c 'echo 0 > /sys$DEVPATH/device/authorized'"`
        ].join(", ") + `\n`;

    }

    await writeFileAssertSuccess(udevRulesPath, rules);

    await run("systemctl restart udev.service");

    console.log(`Success: Rules wrote in ${udevRulesPath}:\n\n${rules}`.green);


}


async function grantAccessTntDevices() {

    await run("chmod 777 /dev/tnt*");

    console.log("access tnt* devices granted");

}

async function checkDependencies() {

    console.log("in check dependencies");

    try {

        await run("cat /etc/modules | grep tty0tty");

    } catch (error) {

        console.log("Error: Seems like tty0tty is not installed");
        process.exit(-1);

    }

    console.log("tty0tty ok");


    try {

        await run("which asterisk");

    } catch (error) {
        console.log(`Error: Seems like asterisk is not installed`.red);
        process.exit(-1);

    }

    if (!existsSync(astConfPath)) {
        console.log(`Error: ${astConfPath} does not exist`.red);
        process.exit(-1);
    }

    console.log("asterisk ok");


    let chanDongleModulePath = path.join("/usr", "lib", "asterisk", "modules", "chan_dongle.so");

    if (!existsSync(chanDongleModulePath)) {
        console.log(`Error: Seems like chan_dongle is not installed, ${chanDongleModulePath} does not exist`.red);
        process.exit(-1);
    }

    console.log("chan_dongle ok");


}


async function resetChanDongle() {

    await chanDongleConfManager.reset()

    await run(`chmod u+rw,g+rw,o+rw ${dongleConfPath}`);

    console.log("chan dongle has been reset");

}


async function removeUdevRules() {

    try { unlinkSync(udevRulesPath); } catch (error) { }

    await run("systemctl restart udev.service");

    console.log("Rules successfully uninstalled".green);

}

async function removeService() {

    try {

        await run("systemctl stop dongle-extended.service");

        await run("systemctl disable dongle-extended.service");

    } catch (error) { }

    try { unlinkSync(systemdServicePath); } catch (error) { }

    await run("systemctl daemon-reload");

    console.log("dongle-extended.service removed from systemd".green);

}


export function run(command: string): Promise<string> {

    return new Promise<string>((resolve, reject) => {

        exec(command, (error, stdout) => {

            if (error) {
                reject(new Error(error.message));
                return;
            }

            resolve(stdout);

        });

    });

}


export function ask(question): Promise<string> {

    const rl = readline.createInterface({
        "input": process.stdin,
        "output": process.stdout
    })

    return new Promise<string>(resolve => {

        rl.question(question + "\n> ", answer => {

            resolve(answer);

            rl.close();

        });


    });

}

export function writeFileAssertSuccess(filename: string, data: string): Promise<void> {

    return new Promise<void>(
        resolve => writeFile(
            filename,
            data,
            { "encoding": "utf8", "flag": "w" },
            error => {
                if (error) {
                    console.log(`Error: Failed to write ${filename}: ${error.message}`.red);
                    process.exit(1);
                }
                resolve();
            }
        )
    );

}