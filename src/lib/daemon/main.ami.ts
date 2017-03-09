
import { activeModems, lockedModems } from "./main";
import { AmiService } from "./lib/AmiService";
import { UserEvent } from "../shared/AmiUserEvent";
import { divide } from "../tools/divide";

import * as _debug from "debug";
let debug = _debug("_main.ami");

activeModems.evtSet.attach(imei => {

    debug(`New active modem ${imei}`);

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

    modem.evtMessage.attach(
        ({
            number,
            date,
            text
        }) => AmiService.postEvent(
                UserEvent.Event.NewMessage.buildAction(
                    imei,
                    number,
                    date.getTime().toString(),
                    JSON.stringify(text)
                )
            )
    );


});

activeModems.evtDelete.attach(imei => {

    debug(`Modem terminate ${imei}`);

    AmiService.postEvent(
        UserEvent.Event.DongleDisconnect.buildAction(
            imei
        )
    );
}
);

lockedModems.evtSet.attach(imei => {

    let { pinState, tryLeft } = lockedModems.get(imei)!;

    debug(`Locked modem: ${pinState}, ${tryLeft}`);

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

        let text: string;

        try {
            text = JSON.parse(evtRequest.text);
        } catch (error) {
            text = evtRequest.text;
        }

        modem.sendMessage(
            evtRequest.number,
            text,
            messageId => {

                if (isNaN(messageId))
                    return replyError("Message not send");

                callback(
                    UserEvent.Response.SendMessage.buildAction(
                        actionid,
                        messageId.toString()
                    )
                );
            }
        );

    } else if (UserEvent.Request.GetLockedDongles.matchEvt(evtRequest))
        callback(
            UserEvent.Response.GetLockedDongles.buildAction(
                actionid,
                JSON.stringify(lockedModems.toObject())
            )
        );
    else if (UserEvent.Request.GetSimPhonebook.matchEvt(evtRequest)){

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        let contactsSplit= divide(900,JSON.stringify(modem.contacts));

        let phonebookpart1= contactsSplit[0];
        let phonebookpart2= contactsSplit[1] || "";
        let phonebookpart3= contactsSplit[2] || "";

        callback(
            UserEvent.Response.GetSimPhonebook.buildAction(
                actionid,
                phonebookpart1,
                phonebookpart2,
                phonebookpart3
            )
        );
    }else if( UserEvent.Request.CreateContact.matchEvt(evtRequest)){

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        let { name, number } = evtRequest;

        //TODO: validate params.

        modem.createContact(number, name,
            contact => callback(
                UserEvent.Response.CreateContact.buildAction(
                    actionid,
                    contact.index.toString(),
                    contact.name,
                    contact.number
                )
            )
        );
    } else if( UserEvent.Request.DeleteContact.matchEvt(evtRequest)){

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        let index= parseInt(evtRequest.index);

        if( !modem.getContact(index) )
            return replyError(`Contact index ${index} does not exist`);

        modem.deleteContact(index,
            () => callback(
                UserEvent.Response.DeleteContact.buildAction(
                    actionid
                )
            )
        );

    } else if (UserEvent.Request.GetActiveDongles.matchEvt(evtRequest))
        callback(
            UserEvent.Response.GetActiveDongles.buildAction(
                evtRequest.actionid!,
                JSON.stringify(activeModems.keysAsArray())
            )
        );
    else if (UserEvent.Request.UnlockDongle.matchEvt(evtRequest)) {

        let { imei } = evtRequest;

        let lockedModem = lockedModems.get(imei);

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

        lockedModems.delete(imei);

        callback(
            UserEvent.Response.buildAction(
                command,
                actionid!
            )
        );


    } else
        return replyError(`Unknown command ${command}`);


});