/*<HARDWARE>usb<-->accessPoint.dataIfPath<THIS MODULE>tty0tty.leftEnd<-->tty0tty.rightEnd<CHAN DONGLE>*/
/*<HARDWARE>usb<-->/dev/ttyUSB1<THIS MODULE>/dev/tnt0<-->/dev/tnt1<CHAN DONGLE>*/

import { SerialPortExt, AtMessage, Modem, AccessPoint } from "ts-gsm-modem";
import { Api as ChanDongleConfManageApi } from "./chanDongleConfManager";
import { Tty0tty } from "./Tty0tty";
import { log, fileOnlyLog } from "./logger";

import * as _debug from "debug";

let debug = _debug("bridge");
debug.enabled= true;
debug.log= log;

let fileOnlyDebug= _debug("bridge");
fileOnlyDebug.enabled= true;
fileOnlyDebug.log= fileOnlyLog;

import * as types from "./types";

export function init(modems: types.Modems, chanDongleConfManagerApi: ChanDongleConfManageApi ) {

    bridge.chanDongleConfManagerApi=chanDongleConfManagerApi;

    let tty0ttyFactory = Tty0tty.makeFactory();

    modems.evtCreate.attach(([modem, accessPoint]) => {

        if (types.LockedModem.match(modem)) {
            return;
        }

        bridge(accessPoint, modem, tty0ttyFactory());

    });

}

const ok = "\r\nOK\r\n";

async function bridge(accessPoint: AccessPoint, modem: Modem, tty0tty: Tty0tty) {

    bridge.chanDongleConfManagerApi.addDongle({
        "dongleName": accessPoint.friendlyId,
        "data": tty0tty.rightEnd,
        "audio": accessPoint.audioIfPath
    });

    let portVirtual = new SerialPortExt(
        tty0tty.leftEnd,
        {
            "baudRate": 115200,
            "parser": SerialPortExt.parsers.readline("\r")
        }
    );

    modem.evtTerminate.attachOnce(
        async () => {

            debug("Modem terminate => closing bridge");

            await bridge.chanDongleConfManagerApi.removeDongle(accessPoint.friendlyId);

            debug("Dongle removed from chan dongle config");

            if (portVirtual.isOpen()) {

                await new Promise<void>(
                    resolve => portVirtual.close(() => resolve())
                );

                debug("Virtual port closed");
            }

            tty0tty.release();

        }
    );

    portVirtual.evtError.attach(serialPortError => {
        debug("uncaught error serialPortVirtual", serialPortError);
        modem.terminate();
    });

    const serviceProviderShort = (modem.serviceProviderName || "Unknown SP").substring(0, 15);

    const forwardResp = (rawResp: string) => {

        if (modem.runCommand_isRunning) {
            debug(`Newer command from chanDongle, dropping ${JSON.stringify(rawResp)}`.red);
            return;
        }

        fileOnlyDebug("response: " + JSON.stringify(rawResp).blue);

        portVirtual.writeAndDrain(rawResp);

    };

    portVirtual.on("data", (buff: Buffer) => {

        if (modem.isTerminated) return;

        let command = buff.toString("utf8") + "\r";

        fileOnlyDebug("from chan_dongle: " + JSON.stringify(command));

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

        fileOnlyDebug(`forwarding urc: ${JSON.stringify(urc.raw).blue}`);

        portVirtual.writeAndDrain(urc.raw)

    });

};

namespace bridge {

    export let chanDongleConfManagerApi!: ChanDongleConfManageApi;

}