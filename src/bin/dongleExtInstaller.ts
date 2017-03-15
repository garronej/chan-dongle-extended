import { spawn } from "child_process";
import * as readline from "readline";
import { writeFile, unlinkSync } from "fs";
import * as program from "commander";
import * as path from "path";
import { recordIfNum } from "gsm-modem-connection";
const vendorIds= Object.keys(recordIfNum);
require("colors");

const systemdServicePath = "/etc/systemd/system/dongleExt.service";
const udevRulesPath = "/etc/udev/rules.d/99-dongleExt.rules";

program
    .version('0.0.1')

program
    .command("install-service")
    .description("Install dongleExt as a systemd service")
    .action(async () => {

        const node_execpath = process.argv[0];

        console.log([
            "Now you will be ask to choose the user that will run the service\n",
            "Be aware that this user need read access to /ect/asterisk/manager.conf",
            " and read/write access to /etc/asterisk/dongles.conf"
        ].join("").yellow);

        const user = await ask("User? (default root)");

        const group = await ask("Group? (default root)");

        let service = [
            `[Unit]`,
            `Description=chan dongle extended service`,
            `Requires=After=asterisk.service`,
            ``,
            `[Service]`,
            `ExecStart=${node_execpath} ${process.cwd()}/out/lib/daemon/main`,
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
            `sudo systemctl start dongleExt.service`,
            `To automatically start the service on boot:`.yellow,
            `sudo systemctl enable dongleExt.service`,
        ].join("\n"));

        process.exit(0);


    });

program
    .command("uninstall-service")
    .description("Remove dongleExt service from systemd ")
    .action(async () => {

        await runShellCommand("systemctl stop dongleExt.service");

        await runShellCommand("systemctl disable dongleExt.service");

        try { unlinkSync(systemdServicePath); } catch (error) { }

        await runShellCommandAssertSuccess("systemctl daemon-reload");

        console.log("Rules successfully uninstalled".green);

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

            rules += match + `${match}ACTION=="add" MODE="0666", GROUP="root"\n`;


        }

        await writeFileAssertSuccess(udevRulesPath, rules);

        await runShellCommandAssertSuccess("systemctl restart udev.service");

        console.log(`Success: Rules wrote in ${udevRulesPath}:\n${rules}`.green);

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


function runShellCommand(cmd: string): Promise<number> {

    let [prog, ...args] = cmd.split(" ");

    return new Promise<number>(resolve => {

        spawn(prog, args).once("close", resolve);

    });

}

async function runShellCommandAssertSuccess(cmd: string): Promise<void> {

    let code = await runShellCommand(cmd);

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