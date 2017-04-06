#!/usr/bin/env node
import { spawn } from "child_process";
import * as readline from "readline";
import { readFileSync, writeFile, unlinkSync, existsSync, chmodSync } from "fs";
import * as program from "commander";
import * as path from "path";
import { recordIfNum } from "gsm-modem-connection";
import { ini } from "ini-extended";
import {
    AmiCredential,
    asteriskConfDirPath,
    managerConfPath
} from "chan-dongle-extended-client";
import { dongleConfPath } from "../lib/ChanDongleConfManager";
import "colors";


const vendorIds = Object.keys(recordIfNum);
const systemdServicePath = path.join("/etc", "systemd", "system", "dongle-extended.service");
const udevRulesPath = path.join("/etc", "udev", "rules.d", "99-dongle-extended.rules");

process.on("unhandledRejection", error => {
    console.log("INTERNAL ERROR INSTALLER");
    console.log(error);
    throw error;
});

program
    .version('0.0.1')

program
    .command("check-dependencies")
    .description("check that asterisk and chan_dongles are installed")
    .action(async () => {
        
        let code = await runShellCommand("which asterisk");

        if (code) {
            console.log(`Error: Seems like asterisk is not installed`.red);
            process.exit(-1);
        }

        if (!existsSync(asteriskConfDirPath)) {
            console.log(`Error: ${asteriskConfDirPath} does not exist`.red);
            process.exit(-1);
        }

        if (!existsSync(dongleConfPath)) {
            console.log(`Error: Seems like chan_dongle is not installed, ${dongleConfPath} does not exist`.red);
            process.exit(-1);
        }

        process.exit(0);
    });


program
    .command("enable-manager")
    .description("Enable asterisk manager if necessary and give write access to dongle.config")
    .action(async () => {

        let general = {
            "enabled": "yes",
            "port": "5038",
            "bindaddr": "127.0.0.1",
            "displayconnects": "no"
        };

        const dongle_ext_user = {
            "secret": Date.now().toString(),
            "deny": "0.0.0.0/0.0.0.0",
            "permit": "0.0.0.0/0.0.0.0",
            "read": "system,user,config,agi",
            "write": "system,user,config,agi",
            "writetimeout": "5000"
        };


        if (existsSync(managerConfPath)) {
            try {
                general = ini.parseStripWhitespace(readFileSync(managerConfPath, "utf8")).general;
                general.enabled = "yes";
            } catch (error) { }
        }

        await writeFileAssertSuccess(managerConfPath, ini.stringify({ general, dongle_ext_user }));

        chmodSync(managerConfPath, "775");
        chmodSync(dongleConfPath, "777");

        await runShellCommand(`asterisk -rx`, ["core reload"]);

        console.log("Asterisk Manager successfully enabled");

        process.exit(0);

    });

program
    .command("install-service")
    .description("Install dongle-extended as a systemd service")
    .action(async () => {

        const node_execpath = process.argv[0];

        console.log([
            "Now you will be ask to choose the user that will run the service\n",
        ].join("").yellow);

        const user = await ask("User? (press enter for root)");

        const group = await ask("Group? (press enter for root)");

        let service = [
            `[Unit]`,
            `Description=chan dongle extended service`,
            `After=network.target`,
            ``,
            `[Service]`,
            `ExecStart=${node_execpath} ${process.cwd()}/dist/lib/main`,
            `WorkingDirectory=${process.cwd()}`,
            `Restart=always`,
            `RestartSec=10`,
            `StandardOutput=syslog`,
            `StandardError=syslog`,
            `SyslogIdentifier=DongleExt`,
            `User=${user || "root"}`,
            `Group=${group || "root"}`,
            `Environment=NODE_ENV=production DEBUG=_*`,
            ``,
            `[Install]`,
            `WantedBy=multi-user.target`,
            ``
        ].join("\n");

        await writeFileAssertSuccess(systemdServicePath, service);

        await runShellCommandAssertSuccess("systemctl daemon-reload");

        console.log([
            `Chan dongle extended service installed!`.green,
            `${systemdServicePath}: \n\n ${service}`,
            `To run the service:`.yellow,
            `sudo systemctl start dongle-extended`,
            `To automatically start the service on boot:`.yellow,
            `sudo systemctl enable dongle-extended`,
        ].join("\n"));

        process.exit(0);


    });

program
    .command("uninstall-service")
    .description("Remove dongle-extended service from systemd ")
    .action(async () => {

        await runShellCommand("systemctl stop dongle-extended.service");

        await runShellCommand("systemctl disable dongle-extended.service");

        try { unlinkSync(systemdServicePath); } catch (error) { }

        await runShellCommandAssertSuccess("systemctl daemon-reload");

        console.log("dongle-extended.service removed from systemd".green);

        process.exit(0);


    });

program
    .command("set-udev-rules")
    .description("Set udev rules to automatically give write/write access to the connected dongles")
    .action(async () => {

        let rules = "";

        for (let vendorId of vendorIds) {

            let match = [
                `ENV{ID_VENDOR_ID}=="${vendorId}", `,
                `ENV{ID_USB_DRIVER}!="usb-storage", `,
                `ENV{ID_USB_INTERFACE_NUM}=="[0-9]*", `
            ].join("");

            rules += `${match}ACTION=="add" MODE="0666", GROUP="root"\n`;


        }

        await writeFileAssertSuccess(udevRulesPath, rules);

        await runShellCommandAssertSuccess("systemctl restart udev.service");

        console.log(`Success: Rules wrote in ${udevRulesPath}:\n\n${rules}`.green);

        process.exit(0);



    });


program
    .command("remove-udev-rules")
    .description("remove udev rules for changing permission on connected dongles")
    .action(async () => {

        try { unlinkSync(udevRulesPath); } catch (error) { }

        await runShellCommandAssertSuccess("systemctl restart udev.service");

        console.log("Rules successfully uninstalled".green);

        process.exit(0);

    });


program.parse(process.argv);

function runShellCommand(cmd: string, extraArgs?: string[]): Promise<number> {

    let [prog, ...args] = cmd.split(" ");

    if (extraArgs) args = [...args, ...extraArgs];

    return new Promise<number>(resolve => spawn(prog, args).once("close", resolve));

}

async function runShellCommandAssertSuccess(cmd: string, extraArgs?: string[]): Promise<void> {

    let code = await runShellCommand(cmd, extraArgs);

    if (code !== 0) {
        console.log(`Error: ${cmd} fail`.red);
        return process.exit(code);
    }


}

function ask(question): Promise<string> {

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

function writeFileAssertSuccess(filename: string, data: string): Promise<void> {

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