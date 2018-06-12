import * as repl from "repl";
import { Modem, ConnectionMonitor } from "ts-gsm-modem";

import * as types from "./types";
import "colors";

export function start(modems: types.Modems) {

    const { context } = repl.start({
        "terminal": true,
        "prompt": "> "
    }) as any;

    Object.defineProperty(context, "exit", {
        "get": () => process.emit("beforeExit", 0)
    });

    Object.defineProperty(context, "accessPoints", {
        "get": () => ConnectionMonitor.getInstance().connectedModems
    });

    Object.defineProperty(context, "modem", {
        "get": () => modems.valuesAsArray()[0]
    });

    Object.defineProperty(context, "modems", {
        "get": () => modems.valuesAsArray()
    });

    context.run = async function (command: string) {

        let modem = context.modem;

        if (!modem) {
            console.log("No active modem to run command on");
            return;
        }

        const { resp, final } = await (modem.atStack.runCommand as typeof Modem.prototype.runCommand)(
            command + "\r",
            { "recoverable": true, "retryOnErrors": false }
        );

        if (resp){
             console.log(JSON.stringify(resp, null, 2));
        }

        if (final.isError){
             console.log(JSON.stringify(final, null, 2).red);
        } else {
            console.log(final.raw.green);
        }

    };


}

