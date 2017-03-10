
import { 
    SerialPortExt, 
    ReportMode
} from "../../../../ts-gsm-modem/out/lib/index";

import { ChanDongleConfManager } from "./lib/ChanDongleConfManager";
import { Tty0tty } from "./lib/Tty0tty";
import { lockedModems, activeModems } from "./main";

import * as _debug from "debug";
let debug = _debug("_main.bridge");

activeModems.evtSet.attach( imei => {

    let { modem, accessPoint } = activeModems.get(imei)!;

    let voidModem = Tty0tty.getPair();

    ChanDongleConfManager.addDongle({
        "id": "Dongle" + accessPoint.rpiPort,
        "atInterface": voidModem.rightEnd,
        "audioInterface": accessPoint.audioInterface
    });

    let portVirtual = new SerialPortExt(voidModem.leftEnd, {
        "baudRate": 115200,
        "parser": SerialPortExt.parsers.readline("\r")
    });


    modem.evtTerminate.attachOnce(error => {

        debug("modem disconnect", error);

        activeModems.delete(modem.imei);

        ChanDongleConfManager.removeDongle("Dongle" + accessPoint.rpiPort, () => {

            portVirtual.close(error => {

                voidModem.release();

            });

        });

    });

    portVirtual.evtError.attach(serialPortError =>
        debug("uncaught error serialPortVirtual", serialPortError)
    );

    portVirtual.on("open", () => debug("portVirtual open".green));

    modem.evtUnsolicitedAtMessage.attach(urc => {

        debug(JSON.stringify(urc, null, 2).yellow);
        portVirtual.writeAndDrain(urc.raw)

    });

    portVirtual.on("data", (buff: Buffer) => {

        let command = buff.toString("utf8") + "\r";

        let forwardResp = (rawResp: string) => {

            if (modem.runCommand.isRunning) {
                debug([
                    `Newer command from chanDongle`,
                    `dropping ${JSON.stringify(rawResp)} response to ${JSON.stringify(command)} command`
                ].join("\n").red);
                return;
            }

            debug(JSON.stringify(rawResp).blue);

            portVirtual.writeAndDrain(rawResp, error => {

                if (error) {

                    if (error.causedBy === "drain")
                        debug("drain problem".red, error);
                    else if (error.causedBy === "write")
                        debug("write problem".america, error);

                }

            });

        };

        if (command === "ATZ\r" || command.match(/^AT\+CNMI=/)) {
            forwardResp("\r\nOK\r\n");
            return;
        }

        debug(JSON.stringify(command).green);

        if (modem.runCommand.isRunning) {

            debug([
                `a command is already running`,
                `${modem.runCommand.queuedCalls.length} command in stack`,
                `flushing the pending command in stack`
            ].join("\n").yellow);

            modem.runCommand.cancelAllQueuedCalls();
        }


        //TODO: make a special stack here... or not because it's external
        modem.runCommand(command, {
            "recoverable": true,
            "reportMode": ReportMode.NO_DEBUG_INFO,
            "retryOnErrors": false
        }, (_, __, rawResp) => forwardResp(rawResp));

    });



});