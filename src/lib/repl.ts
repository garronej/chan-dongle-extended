import * as repl from "repl";
import { activeModems, lockedModems } from "./main";
import "colors";

import { Monitor } from "gsm-modem-connection";
import { Modem } from "ts-gsm-modem";

const { context } = repl.start({
    "terminal": true,
    "prompt": "> "
}) as any;

Object.defineProperty(context, "exit", {
    "get": () => process.exit(0)
});

Object.defineProperty(context, "accessPoints", {
    "get": () => Monitor.connectedModems
});

Object.defineProperty(context, "modem", {
    "get": () => activeModems.valuesAsArray()[0]
});

Object.assign(context, { activeModems, lockedModems });

context.run = async function (command: string) {

    let modem = context.modem;

    if (!modem) {
        console.log("No active modem to run command on");
        return;
    }

    let [resp, final] = await (modem.atStack.runCommand as typeof Modem.prototype.runCommand)(
        command + "\r",
        { "recoverable": true, "retryOnErrors": false }
    );

    if (resp) console.log(JSON.stringify(resp, null, 2));

    if (final.isError) console.log(JSON.stringify(final, null, 2).red);
    else console.log(final.raw.green);

};