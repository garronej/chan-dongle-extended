import { Ami } from "./Ami";

import { amiConfig } from "./managerConfig";

import * as AstMan from "asterisk-manager";

let ami: any;

export function initClient(config?: typeof amiConfig ){ 

    if (!config) config = amiConfig;

    ami = new AstMan(
        amiConfig.port,
        amiConfig.host,
        amiConfig.user,
        amiConfig.secret,
        true
    );

    return {
        sendMessage,
        "disconnect": (): void=> ami.disconnect()
    };

}


function sendMessage(imei, number, text, callback?: (error: Error | null, messageId: number) => void) {

    let actionid = ami.action(
        Ami.UserEvent.Request.SendMessage.buildAction(
            imei, number, JSON.stringify(text)
        )
    );

    if (!callback) return;

    ami.on("managerevent", function callee(evt: Ami) {

        if (!Ami.UserEvent.Response.SendMessage.matchEvt(evt, actionid))
            return;

        ami.removeListener("managerevent", callee);

        callback(evt.error?new Error(evt.error):null, parseInt(evt.messageid));

    });

}
