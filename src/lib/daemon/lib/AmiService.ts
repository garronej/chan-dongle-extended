
import * as AstMan from "asterisk-manager";
import { SyncEvent } from "ts-events-extended";
import { AmiCredential } from "../../shared/AmiCredential";
import { Contact } from "../../../../../ts-gsm-modem/out/lib/index";
import { ObjectExt } from "object-extended";
import { UserEvent } from "../../shared/AmiUserEvent";

import * as _debug from "debug";
let debug= _debug("_AmiService");

require("colors");

export class AmiService {

    private constructor(){}

    public static readonly evtRequest = new SyncEvent<{
        evtRequest: UserEvent.Request;
        callback: (actionResponse: UserEvent.Response) => void;
    }>();

    public static postEvent(actionEvent: UserEvent.Event): void {

        debug("actionEvent", actionEvent);

        ami.action(actionEvent);
    }


}

const { port, host, user, secret } = AmiCredential.retrieve();

const ami = new AstMan( port, host, user, secret, true);

ami.keepConnected();

ami.on("userevent", (evt: UserEvent): void => {

    if (!UserEvent.Request.matchEvt(evt))
        return;
    
    debug("evtRequest", evt);

    AmiService.evtRequest.post({
        "evtRequest": evt,
        "callback": actionResponse => {

            debug("actionResponse", actionResponse);

            ami.action(actionResponse);
        }
    });


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