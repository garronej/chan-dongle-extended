import * as repl from "repl";
import { activeModems, lockedModems } from "./main";
import "colors";

let replSession: { 
    imei: string, 
    value: NodeJS.EventEmitter 
} | undefined = undefined;

activeModems.evtDelete.attach(([_, imei]) => {

    if( replSession && replSession.imei === imei ){
        (replSession.value as any).close();
        replSession= undefined;
    }

});

activeModems.evtSet.attach(([{ modem }, imei]) => {

    if( replSession ) return;

    let value = repl.start({
        "terminal": true,
        "prompt": "> "
    });

    let { context } = value as any;

    Object.assign(context, {
        modem,
        async run(command: string) {

            let [resp, final] = await (modem as any).atStack.runCommand(
                command + "\r",
                { "recoverable": true, "retryOnErrors": false }
            );

            if (resp)
                console.log(JSON.stringify(resp, null, 2));

            if (final.isError)
                console.log(JSON.stringify(final, null, 2).red);
            else
                console.log(final.raw.green);

        }
    });

    Object.defineProperty(context, "exit", {
        "get": ()=> process.exit(0)
    });

    replSession = { imei, value };

});