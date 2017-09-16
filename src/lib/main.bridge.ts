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

const ok = "\r\nOK\r\n";

activeModems.evtSet.attach(
    async ([modem, accessPoint]) => {

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

        const serviceProviderShort = (modem.serviceProviderName || "Unknown SP").substring(0, 15);

        const forwardResp = (rawResp: string) => {

            if (modem.runCommand_isRunning) {
                debug(`Newer command from chanDongle, dropping ${JSON.stringify(rawResp)}`.red);
                return;
            }

            debug("response: " + JSON.stringify(rawResp).blue);

            portVirtual.writeAndDrain(rawResp);

        };

        portVirtual.on("data", (buff: Buffer) => {

            if (modem.isTerminated) return;

            let command = buff.toString("utf8") + "\r";

            debug("from chan_dongle: " + JSON.stringify(command));

            if (
                command === "ATZ\r" ||
                command.match(/^AT\+CNMI=/)
            ) {

                forwardResp(ok);
                return;

            } else if (command === "AT\r") {

                forwardResp(ok);
                modem.ping();
                return;

            } else if (command === "AT+COPS?\r") {

                forwardResp(`\r\n+COPS: 0,0,"${serviceProviderShort}",0\r\n${ok}`);
                return;

            }

            if (modem.runCommand_queuedCallCount) {

                debug([
                    `a command is already running and`,
                    `${modem.runCommand_queuedCallCount} command in stack`,
                    `flushing the pending command in stack`
                ].join("\n").yellow);

            }

            modem.runCommand_cancelAllQueuedCalls();

            modem.runCommand(command, {
                "recoverable": true,
                "reportMode": AtMessage.ReportMode.NO_DEBUG_INFO,
                "retryOnErrors": false
            }, (_, __, rawResp) => forwardResp(rawResp));

        });

        await portVirtual.evtData.waitFor();

        modem.evtUnsolicitedAtMessage.attach(urc => {

            debug(`forwarding urc: ${JSON.stringify(urc.raw).blue}`);

            portVirtual.writeAndDrain(urc.raw)

        });

    }
);
