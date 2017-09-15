/*<HARDWARE>usb<-->accessPoint.dataIfPath<THIS MODULE>voidModem.leftEnd<-->voidModem.rightEnd<CHAN DONGLE>*/
/*<HARDWARE>usb<-->/dev/ttyUSB1<THIS MODULE>/dev/tnt0<-->/dev/tnt1<CHAN DONGLE>*/

import {
    SerialPortExt,
    AtMessage
} from "ts-gsm-modem";

import { chanDongleConfManager } from "./chanDongleConfManager";
import { Tty0tty } from "./Tty0tty";
import {
    lockedModems,
    activeModems,
    getDongleName
} from "./main";

import * as _debug from "debug";
let debug = _debug("_main.bridge");

activeModems.evtSet.attach(
    async ([modem, accessPoint]) => {

        if (1 + 1 === 3) {

            debug("chan_dongle bridge disabled !");

            return;
        }

        let dongleName = getDongleName(accessPoint);

        let voidModem = Tty0tty.getPair();

        chanDongleConfManager.addDongle({
            dongleName,
            "data": voidModem.rightEnd,
            "audio": accessPoint.audioIfPath
        });

        let portVirtual = new SerialPortExt(
            voidModem.leftEnd,
            {
                "baudRate": 115200,
                "parser": SerialPortExt.parsers.readline("\r")
            }
        );

        modem.evtTerminate.attachOnce(
            async () => {

                debug("Modem terminate => closing bridge");

                await chanDongleConfManager.removeDongle(dongleName);

                debug("Dongle removed from chan dongle config");

                if (portVirtual.isOpen()) {

                    await new Promise<void>(
                        resolve => portVirtual.close(() => resolve())
                    );

                    debug("Virtual port closed");
                }

                voidModem.release();

            }
        );

        portVirtual.evtError.attach(serialPortError => {
            debug("uncaught error serialPortVirtual", serialPortError);
            modem.terminate(new Error("Bridge serialport error"));
        });


        portVirtual.on("data", (buff: Buffer) => {

            if (modem.isTerminated) return;

            let command = buff.toString("utf8") + "\r";

            let forwardResp = (rawResp: string) => {

                if (modem.runCommand_isRunning) {
                    debug([
                        `Newer command from chanDongle`,
                        `dropping ${JSON.stringify(rawResp)} response to ${JSON.stringify(command)} command`
                    ].join("\n").red);
                    return;
                }

                debug("response: " + JSON.stringify(rawResp).blue);

                portVirtual.writeAndDrain(rawResp);

            };

            debug("from chan_dongle: " + JSON.stringify(command));

            if (
                command === "ATZ\r" ||
                command === "AT\r" ||
                command.match(/^AT\+CNMI=/)
            ) {
                debug("fake resp...");
                forwardResp("\r\nOK\r\n");
                return;
            }

            if (modem.runCommand_isRunning) {

                debug([
                    `a command is already running`,
                    `${modem.runCommand_queuedCallCount} command in stack`,
                    `flushing the pending command in stack`
                ].join("\n").yellow);

                modem.runCommand_cancelAllQueuedCalls();
            }

            modem.runCommand(command, {
                "recoverable": true,
                "reportMode": AtMessage.ReportMode.NO_DEBUG_INFO,
                "retryOnErrors": false
            }, (_, __, rawResp) => forwardResp(rawResp));

        });

        await portVirtual.evtData.waitFor();

        modem.evtUnsolicitedAtMessage.attach(urc => {

            debug("forwarding urc: " + JSON.stringify(urc.raw));

            portVirtual.writeAndDrain(urc.raw)

        });

    }
);
