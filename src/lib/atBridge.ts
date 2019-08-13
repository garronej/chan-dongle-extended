/*<HARDWARE>usb<-->accessPoint.dataIfPath<THIS MODULE>tty0tty.leftEnd<-->tty0tty.rightEnd<CHAN DONGLE>*/
/*<HARDWARE>usb<-->/dev/ttyUSB1<THIS MODULE>/dev/tnt0<-->/dev/tnt1<CHAN DONGLE>*/

import { SerialPortExt, AtMessage, Modem, AccessPoint } from "ts-gsm-modem";
import { Api as ConfManagerApi } from "./confManager";
import { Tty0tty } from "./Tty0tty";
import * as logger from "logger";
import * as types from "./types";
import { VoidSyncEvent } from "ts-events-extended";
import * as runExclusive from "run-exclusive";

const debug = logger.debugFactory();

function readableAt(raw: string): string {
    return "`" + raw.replace(/\r/g, "\\r").replace(/\n/g, "\\n") + "`";
}

export function init(
    modems: types.Modems,
    chanDongleConfManagerApi: ConfManagerApi
) {

    atBridge.confManagerApi = chanDongleConfManagerApi;

    const tty0ttyFactory = Tty0tty.makeFactory();

    modems.evtCreate.attach(async ([modem, accessPoint]) => {

        if (types.LockedModem.match(modem)) {
            return;
        }

        atBridge(accessPoint, modem, tty0ttyFactory());

    });

}


export async function waitForTerminate(): Promise<void> {

    if (waitForTerminate.ports.size === 0) {
        return Promise.resolve();
    }

    await waitForTerminate.evtAllClosed.waitFor();

    debug("All virtual serial ports closed");

}

export namespace waitForTerminate {

    export const ports = new Set<SerialPortExt>();

    export const evtAllClosed = new VoidSyncEvent();

}

function atBridge(
    accessPoint: AccessPoint,
    modem: Modem,
    tty0tty: Tty0tty
) {

    const { confManagerApi } = atBridge;

    (
        modem.isGsmConnectivityOk() ?
            Promise.resolve() :
            modem.evtGsmConnectivityChange.waitFor()
    ).then(async function callee() {

        if (!!modem.terminateState) {
            return;
        }

        debug("connectivity ok running AT+CCWA");

        const { final } = await modem.runCommand(
            `AT+CCWA=0,0,1\r`,
            { "recoverable": true }
        );

        if (!!final.isError) {

            debug("Failed to disable call waiting".red, final.raw);

            modem.evtGsmConnectivityChange.attachOnce(
                () => modem.isGsmConnectivityOk(),
                () => callee()
            );

            return;

        }

        debug("Call waiting successfully disabled".green);

    });


    const runCommand = runExclusive.build(
        ((...inputs) => modem.runCommand.apply(modem, inputs)
        ) as typeof Modem.prototype.runCommand
    );

    atBridge.confManagerApi.addDongle({
        "dongleName": accessPoint.friendlyId,
        "data": tty0tty.rightEnd,
        "audio": accessPoint.audioIfPath
    });

    const portVirtual = new SerialPortExt(
        tty0tty.leftEnd,
        {
            "baudRate": 115200,
            "parser": SerialPortExt.parsers.readline("\r")
        }
    );

    waitForTerminate.ports.add(portVirtual);

    portVirtual.once("close", () => {

        waitForTerminate.ports.delete(portVirtual);

        if (waitForTerminate.ports.size === 0) {

            waitForTerminate.evtAllClosed.post();

        }

    });

    modem.evtTerminate.attachOnce(
        async () => {

            debug("Modem terminate => closing bridge");

            await confManagerApi.removeDongle(accessPoint.friendlyId);

            if (portVirtual.isOpen()) {

                await new Promise<void>(
                    resolve => portVirtual.close(() => resolve())
                );

            }

            tty0tty.release();

        }
    );

    portVirtual.evtError.attach(serialPortError => {
        debug("uncaught error serialPortVirtual", serialPortError);
        modem.terminate();
    });

    const serviceProviderShort = (modem.serviceProviderName || "Unknown SP").substring(0, 15);

    const forwardResp = (rawResp: string, isRespFromModem: boolean, isPing = false) => {

        if (runExclusive.isRunning(runCommand)) {
            debug(`Newer command from chanDongle, dropping response ${readableAt(rawResp)}`.red);
            return;
        }

        if (!isPing) {

            debug(`(AT) ${!isRespFromModem ? "( fake ) " : ""}modem response: ${readableAt(rawResp)}`);

        }

        portVirtual.writeAndDrain(rawResp);

    };

    portVirtual.on("data", (buff: Buffer) => {

        if (!!modem.terminateState) {
            return;
        }

        const command = buff.toString("utf8") + "\r";

        if (command !== "AT\r") {

            debug(`(AT) command from asterisk-chan-dongle: ${readableAt(command)}`);

        }

        const ok = "\r\nOK\r\n";

        if (
            command === "ATZ\r" ||
            command.match(/^AT\+CNMI=/)
        ) {

            forwardResp(ok, false);
            return;

        } else if (command === "AT\r") {

            forwardResp(ok, false, true);
            modem.ping();
            return;

        } else if (command === "AT+COPS?\r") {

            forwardResp(`\r\n+COPS: 0,0,"${serviceProviderShort}",0\r\n${ok}`, false);
            return;

        }

        if (runExclusive.getQueuedCallCount(runCommand) !== 0) {

            debug([
                `a command is already running and`,
                `${modem.runCommand_queuedCallCount} command in stack`,
                `flushing the pending command in stack`
            ].join("\n").yellow);

        }

        runExclusive.cancelAllQueuedCalls(runCommand);

        runCommand(command, {
            "recoverable": true,
            "reportMode": AtMessage.ReportMode.NO_DEBUG_INFO,
            "retryOnErrors": false
        }).then(({ raw }) => forwardResp(raw, true));

    });

    portVirtual.once("data", () =>
        modem.evtUnsolicitedAtMessage.attach(
            urc => {

                const doNotForward = (
                    urc.id === "CX_BOOT_URC" ||
                    (urc instanceof AtMessage.P_CMTI_URC) && (
                        urc.index < 0 ||
                        confManagerApi.staticModuleConfiguration.defaults["disablesms"] === "yes"
                    )
                );

                if (!doNotForward) {

                    portVirtual.writeAndDrain(urc.raw);

                }

                debug(`(AT) urc: ${readableAt(urc.raw)} ( ${doNotForward ? "NOT forwarded" : "forwarded"} to asterisk-chan-dongle )`);

            }
        )
    );

};

namespace atBridge {

    export let confManagerApi!: ConfManagerApi;

}