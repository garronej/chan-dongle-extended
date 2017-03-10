import { spawn } from "child_process";
import * as readline from "readline";
import { writeFile } from "fs";
require("colors");

const daemonPath = __dirname + "/../lib/daemon";
const servicePath = "/etc/systemd/system/dongleExt.service";

(async () => {

    const nodePath = await new Promise<string>(resolve => {
        spawn("which", ["node"])
            .stdout
            .once("data",
            data => resolve(
                data
                    .toString("utf8")
                    .slice(0, -1)
            )
            );
    });

    console.log([
        "Now you will be ask to choose the user that will run the service\n",
        "Be aware that this user need read access to /ect/asterisk/manager.conf",
        " and read/write access to /etc/asterisk.dongles.conf"
    ].join("").yellow);

    const user = await ask("User? (default root)");

    const group = await ask("Group? (default root)");

    let service = [
        `[Unit]`,
        `Description=chan dongle extended service`,
        `Requires=After=asterisk.service`,
        ``,
        `[Service]`,
        `ExecStart=${nodePath} ${daemonPath}/main`,
        `#WorkingDirectory=${daemonPath}`,
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

    await new Promise<void>(
        resolve => writeFile(
            servicePath,
            service,
            { "encoding": "utf8", "flag": "w" },
            err => {
                if (err) {
                    console.log(err.message.red);
                    process.exit(1);
                }
                resolve();
            }
        )
    );

    console.log([
        `Chan dongle extended service installed!`.green,
        `${servicePath}: \n\n ${service}`,
        `To run the service:`.yellow,
        `sudo systemctl start dongleExt.service`,
        `To automatically start the service on boot:`.yellow,
        `sudo systemctl enable dongleExt.service`,
    ].join("\n")
    );



})();

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