
import * as AstMan from "asterisk-manager";
import { SyncEvent } from "ts-events-extended";
import { amiConfig } from "./managerConfig";
import { Contact } from "../../../ts-gsm-modem/out/lib/index";
import { ObjectExt } from "object-extended";
import { Ami } from "./Ami";

require("colors");


export class AsteriskInterface {

    public static readonly evtCommand = new SyncEvent<{
        evtRequest: Ami.UserEvent.Request;
        callback: (actionResponse: Ami.UserEvent.Response) => void;
    }>();

}

let ami = new AstMan(
    amiConfig.port,
    amiConfig.host,
    amiConfig.user,
    amiConfig.secret,
    true
);

ami.keepConnected();


ami.on("managerevent", (evt: Ami): void => {

    if (!Ami.UserEvent.matchEvt(evt)) return;

    if (Ami.UserEvent.Request.matchEvt(evt)) {

        AsteriskInterface.evtCommand.post({
            "evtRequest": evt,
            "callback": actionResponse => ami.action(actionResponse)
        });

    }

});


function divide(maxLength: number, str: string): string[] {

    function callee(state: string[]): string[] {

        let current = state.pop()!;

        if (current.length > maxLength) {

            let part = current.substring(0, maxLength);

            let rest = current.substring(maxLength, current.length);

            return callee([...state, part, rest]);

        } else return [...state, current];

    }

    return callee([str]);

}