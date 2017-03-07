
import { activeModems, lockedModems } from "./main";
import { AmiService } from "./lib/AmiService";
import { UserEvent } from "../shared/AmiUserEvent";

import * as _debug from "debug";
let debug = _debug("_bridgeAmi");

activeModems.evtSet.attach(imei => {
    AmiService.postEvent(
        UserEvent.Event.NewActiveDongle.buildAction(
            imei
        )
    );

    let { modem } = activeModems.get(imei)!;

    modem.evtMessageStatusReport.attach(
        ({
            messageId,
            dischargeTime,
            isDelivered,
            status
        }) => AmiService.postEvent(
                UserEvent.Event.MessageStatusReport.buildAction(
                    imei,
                    messageId.toString(),
                    dischargeTime.getDate().toString(),
                    isDelivered ? "true" : "false",
                    status
                )
            )
    );


});

activeModems.evtDelete.attach(
    imei => AmiService.postEvent(
        UserEvent.Event.DongleDisconnect.buildAction(
            imei
        )
    )
);

lockedModems.evtSet.attach(imei => {

    let { pinState, tryLeft } = lockedModems.get(imei)!;

    AmiService.postEvent(
        UserEvent.Event.RequestUnlockCode.buildAction(
            imei,
            pinState,
            tryLeft.toString()
        )
    );

});


AmiService.evtRequest.attach(({ evtRequest, callback }) => {

    let { actionid, command } = evtRequest;

    let replyError = (errorMessage: string) => callback(
        UserEvent.Response.buildAction(
            command,
            actionid!,
            errorMessage
        )
    );

    if (UserEvent.Request.SendMessage.matchEvt(evtRequest)) {

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        modem.sendMessage(
            evtRequest.number,
            JSON.parse(evtRequest.text) as string,
            messageId => {

                if (isNaN(messageId))
                    return replyError("Message not send");

                callback(
                    UserEvent.Response.SendMessage.buildAction(
                        actionid!,
                        messageId.toString()
                    )
                );
            }
        );

    } else if (UserEvent.Request.GetLockedDongles.matchEvt(evtRequest))
        callback(
            UserEvent.Response.GetLockedDongles.buildAction(
                evtRequest.actionid!,
                JSON.stringify(lockedModems.toObject())
            )
        );
    else if (UserEvent.Request.GetActiveDongles.matchEvt(evtRequest))
        callback(
            UserEvent.Response.GetActiveDongles.buildAction(
                evtRequest.actionid!,
                JSON.stringify(activeModems.keysAsArray())
            )
        );
    else if (UserEvent.Request.UnlockDongle.matchEvt(evtRequest)) {

        let lockedModem = lockedModems.get(evtRequest.imei);

        if (!lockedModem)
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { pinState, tryLeft } = lockedModem;
        let unlockCallback = lockedModem.callback;

        if (pinState === "SIM PIN") {

            let { pin } = evtRequest;

            if (!pin)
                return replyError(`Wrong parameter, no PIN provided`);

            unlockCallback(pin);

        } else if (pinState === "SIM PUK") {

            let { puk, newpin } = evtRequest;

            if (!puk || !newpin)
                return replyError(`Wrong parameter, no PUK and NEW PIN requested`);

            unlockCallback(puk, newpin);

        } else
            return replyError(`${pinState}, not supported`);

        callback(
            UserEvent.Response.buildAction(
                command,
                actionid!
            )
        );


    } else
        return replyError(`Unknown command ${command}`);


});