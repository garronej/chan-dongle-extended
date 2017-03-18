import * as repl from "repl";
import { activeModems, lockedModems } from "./main";

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

    Object.assign((value as any).context, {
        modem,
        run(command: string): string {

            modem.runCommand(
                command + "\r",
                { "recoverable": true, "retryOnErrors": false },
                (resp, final) => {

                    if (resp)
                        console.log(JSON.stringify(resp, null, 2));

                    if (final.isError)
                        console.log(JSON.stringify(final, null, 2).red);
                    else
                        console.log(final.raw.green);

                }
            );

            return "COMMAND QUEUED";

        }
    });

    replSession = { imei, value };

});