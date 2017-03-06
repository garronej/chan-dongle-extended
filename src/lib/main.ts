import { Modem, ReportMode, SerialPortExt } from "../../../ts-gsm-modem/out/lib/index";

import * as pr from "ts-promisify";
require("colors");

import { DongleConfManager } from "./DongleCongManager";
import { VoidModem } from "./VoidModem";
import { ModemWatcher, Modem as ModemAccessPoint } from "gsm-modem-connection";
import { Ami } from "./Ami";
import { AsteriskInterface } from "./AsteriskInterface";

let setModem: {
    [imei: string]: Modem;
} = {};


AsteriskInterface.evtCommand.attach(({ evtRequest, callback }) => {

    console.log("evtRequest".red, evtRequest);

    let modem: Modem | undefined= undefined;

    if( evtRequest.imei ){

        modem = setModem[evtRequest.imei!];

        if (!modem){
            callback(
                Ami.UserEvent.Response.buildAction(
                    evtRequest.command,
                    evtRequest.actionid!,
                    `Dongle imei: ${evtRequest.imei} not found`
                )
            );
            return;
        }

    }

    if (Ami.UserEvent.Request.SendMessage.matchEvt(evtRequest))
        modem!.sendMessage(
            evtRequest.number,
            JSON.parse(evtRequest.text) as string,
            messageId => callback(
                Ami.UserEvent.Response.SendMessage.buildAction(
                    evtRequest.actionid!,
                    messageId.toString(),
                    isNaN(messageId) ? "Message not sent" : undefined
                )
            )
        );
    else
        callback(
            Ami.UserEvent.Response.buildAction(
                evtRequest.command,
                evtRequest.actionid!,
                "Unknown command"
            )
        );


});

let modemWatcher = new ModemWatcher();

modemWatcher.evtConnect.attach(accessPoint => {

    console.log("accessPoint", accessPoint.infos);

    //modemWatcher.stop();

    Modem.create({
        "path": accessPoint.atInterface,
        "unlockCodeProvider": { "pinFirstTry": "0000", "pinSecondTry": "1234" },
    }, (modem, hasSim) => {

        if (!hasSim) return;

        setModem[modem.imei] = modem;

        modem.evtMessage.attach(message => console.log("NEW MESSAGE: ".green, message));

        let voidModem = VoidModem.get();

        DongleConfManager.add({
            "id": "Dongle" + accessPoint.rpiPort,
            "atInterface": voidModem.extern,
            "audioInterface": accessPoint.audioInterface
        });

        let portVirtual = new SerialPortExt(voidModem.local, {
            "baudRate": 115200,
            "parser": SerialPortExt.parsers.readline("\r")
        });


        modem.evtTerminate.attachOnce(error => {

            console.log("modem disconnect", error);

            DongleConfManager.delete("Dongle" + accessPoint.rpiPort, () => {

                portVirtual.close(error => {

                    voidModem.release();

                });

            });


        });

        portVirtual.evtError.attach(serialPortError =>
            console.log("uncaught error serialPortVirtual", serialPortError)
        );

        portVirtual.on("open", () => console.log("portVirtual open".green));

        modem.evtUnsolicitedAtMessage.attach(urc => {

            console.log(JSON.stringify(urc, null, 2).yellow);
            portVirtual.writeAndDrain(urc.raw)

        });

        portVirtual.on("data", (buff: Buffer) => {

            let command = buff.toString("utf8") + "\r";

            let forwardResp = (rawResp: string) => {

                if (modem.runCommand.isRunning) {
                    console.log([
                        `More recent command from chanDongle`,
                        `dropping ${JSON.stringify(rawResp)} response to ${JSON.stringify(command)} command`
                    ].join("\n").red);
                    return;
                }

                console.log(JSON.stringify(rawResp).blue);

                portVirtual.writeAndDrain(rawResp, error => {

                    if (error) {

                        if (error.causedBy === "drain")
                            console.log("drain problem".red, error);
                        else if (error.causedBy === "write")
                            console.log("write problem".america, error);

                    }

                });

            };

            if (command === "ATZ\r") {
                forwardResp("\r\nOK\r\n");
                return;
            }

            console.log(JSON.stringify(command).green);

            if (modem.runCommand.isRunning) {

                console.log([
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

});


/*
(async () => {

    while (true) {

        await new Promise(resolve => setTimeout(() => resolve(), 10000));

        console.log("up");

    }

})();
*/
