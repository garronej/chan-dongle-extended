import { 
    SerialPortExt,
    AtMessage
} from "ts-gsm-modem";

import { ChanDongleConfManager } from "./ChanDongleConfManager";
import { Tty0tty } from "./Tty0tty";
import { lockedModems, activeModems } from "./main";

import * as pr from "ts-promisify";

import * as _debug from "debug";
let debug = _debug("_main.bridge");

/*<HARDWARE>usb<-->accessPoint.dataIfPath<THIS MODULE>voidModem.leftEnd<-->voidModem.rightEnd<CHAN DONGLE>*/
/*<HARDWARE>usb<-->/dev/ttyUSB1<THIS MODULE>/dev/tnt0<-->/dev/tnt1<CHAN DONGLE>*/

activeModems.evtSet.attach(async ([{ modem, accessPoint }]) => {

    let voidModem = Tty0tty.getPair();

    let id = "Dongle" + modem.imei.substring(0,3) + modem.imei.substring(modem.imei.length-3);

    debug(`Dongle id: ${id}`);

    ChanDongleConfManager.addDongle({
        "id": id,
        "dataIfPath": voidModem.rightEnd,
        "audioIfPath": accessPoint.audioIfPath
    });

    let portVirtual = new SerialPortExt(
        voidModem.leftEnd,
        {
            "baudRate": 115200,
            "parser": SerialPortExt.parsers.readline("\r")
        }
    );

    modem.evtTerminate.attachOnce(async () => {

        debug("Modem terminate => closing bridge");

        await ChanDongleConfManager.removeDongle(id);

        debug("Dongle removed from chan dongle config");

        if (portVirtual.isOpen()){
            await pr.typed(portVirtual, portVirtual.close)();
            debug("Virtual port closed");
        }

        voidModem.release();

    });

    portVirtual.evtError.attach(serialPortError => {
        debug("uncaught error serialPortVirtual", serialPortError);

        modem.terminate(new Error("Bridge serialport error"));
    });


    portVirtual.on("data", (buff: Buffer) => {

        if( modem.isTerminated ) return;

        let command = buff.toString("utf8") + "\r";

        let forwardResp = (rawResp: string) => {

            if (modem.runCommand.isRunning) {
                debug([
                    `Newer command from chanDongle`,
                    `dropping ${JSON.stringify(rawResp)} response to ${JSON.stringify(command)} command`
                ].join("\n").red);
                return;
            }

            //debug(JSON.stringify(rawResp).blue);

            portVirtual.writeAndDrain(rawResp);

        };

        if (command === "ATZ\r" || command.match(/^AT\+CNMI=/)) {
            forwardResp("\r\nOK\r\n");
            return;
        }

        //debug(JSON.stringify(command).green);

        if (modem.runCommand.isRunning) {

            debug([
                `a command is already running`,
                `${modem.runCommand.queuedCalls.length} command in stack`,
                `flushing the pending command in stack`
            ].join("\n").yellow);

            modem.runCommand.cancelAllQueuedCalls();
        }

        modem.runCommand(command, {
            "recoverable": true,
            "reportMode": AtMessage.ReportMode.NO_DEBUG_INFO,
            "retryOnErrors": false
        }, (_, __, rawResp) => forwardResp(rawResp));

    });


    await portVirtual.evtData.waitFor();

    modem.evtUnsolicitedAtMessage.attach(
        urc => portVirtual.writeAndDrain(urc.raw)
    );



});