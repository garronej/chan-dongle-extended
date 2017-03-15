
import * as AstMan from "asterisk-manager";
import { SyncEvent } from "ts-events-extended";
import { AmiCredential } from "../../shared/AmiCredential";
import { Contact } from "../../../../../ts-gsm-modem/out/lib/index";
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

        ami.action(actionEvent);
    }


}

const { port, host, user, secret } = AmiCredential.retrieve();

const ami = new AstMan( port, host, user, secret, true);

ami.keepConnected();

ami.on("userevent", (evt: UserEvent): void => {

    if (!UserEvent.Request.matchEvt(evt))
        return;

    AmiService.evtRequest.post({
        "evtRequest": evt,
        "callback": actionResponse => {

            ami.action(actionResponse);
        }
    });

});

ami.on("userevent", ( { actionid, event, action, userevent, privilege, ...prettyEvt }: UserEvent) => debug(prettyEvt));

