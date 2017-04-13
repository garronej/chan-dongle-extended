import { activeModems, lockedModems } from "./main";
import { Storage } from "./Storage";
import { 
    AmiClient, 
    UserEvent, 
    DongleActive, 
    LockedDongle
} from "chan-dongle-extended-client";

import Event= UserEvent.Event;
import Response= UserEvent.Response;
import Request= UserEvent.Request;

import { Dialplan } from "./Dialplan";

import * as _debug from "debug";
let debug = _debug("_main.ami");

const amiClient= AmiClient.localhost();

Dialplan.amiClient= amiClient;

amiClient.evtAmiUserEvent.attach(({ actionid, event, action, userevent, privilege, ...prettyEvt }) => debug(prettyEvt));

activeModems.evtSet.attach(async ([{ modem, dongleName }, imei]) => {

    debug(`New active modem ${imei}`);

    if (modem.pin) {

        debug(`Persistent storing of pin: ${modem.pin}`);

        if (modem.iccidAvailableBeforeUnlock)
            debug(`for SIM ICCID: ${modem.iccid}`);
        else
            debug(`for dongle IMEI: ${modem.imei}, because SIM ICCID is not readable with this dongle when SIM is locked`);

        let data = await Storage.read();

        data.pins[modem.iccidAvailableBeforeUnlock ? modem.iccid : modem.imei] = modem.pin;

        data.release();


    }

    amiClient.postUserEventAction(
        Event.NewActiveDongle.buildAction(
            imei,
            modem.iccid,
            modem.imsi,
            modem.number || "",
            modem.serviceProviderName || ""
        )
    );

    modem.evtMessageStatusReport.attach(
        ({
            messageId,
            dischargeTime,
            isDelivered,
            status
        }) => amiClient.postUserEventAction(
                Event.MessageStatusReport.buildAction(
                    imei,
                    messageId.toString(),
                    dischargeTime.toISOString(),
                    isDelivered ? "true" : "false",
                    status
                )
            )
    );

    let { imsi } = modem;
    
    modem.evtMessageStatusReport.attach(async statusReport => {

        let {
            messageId,
            dischargeTime,
            isDelivered,
            status
        } = statusReport;

        amiClient.postUserEventAction(
            Event.MessageStatusReport.buildAction(
                imei,
                messageId.toString(),
                dischargeTime.toISOString(),
                isDelivered ? "true" : "false",
                status
            )
        )

        Dialplan.notifyStatusReport(
            {
                "name": dongleName,
                "number": modem.number || "",
                imei,
                imsi,
                "provider": modem.serviceProviderName || ""
            },
            statusReport
        );

    });

    modem.evtMessage.attach(async message => {

        let data = await Storage.read();


        if (!data.messages[imsi])
            data.messages[imsi] = [];

        data.messages[imsi].push(message);

        data.release();

        let { number, date, text } = message;

        amiClient.postUserEventAction(
            UserEvent.Event.NewMessage.buildAction(
                imei,
                number,
                date.toISOString(),
                text
            )
        );


        Dialplan.notifySms(
            {
                "name": dongleName,
                "number": modem.number || "",
                imei,
                imsi,
                "provider": modem.serviceProviderName || ""
            },
            message
        );


    });


});


activeModems.evtDelete.attach(
    ([{ modem }]) => amiClient.postUserEventAction(
        Event.DongleDisconnect.buildAction(
            modem.imei,
            modem.iccid,
            modem.imsi,
            modem.number || "",
            modem.serviceProviderName || ""
        )
    )
);


lockedModems.evtSet.attach(
    async ([{ iccid, pinState, tryLeft, callback }, imei]) => {

        debug(`Locked modem IMEI: ${imei},ICCID: ${iccid}, ${pinState}, ${tryLeft}`);

        let data = await Storage.read();

        let pin = data.pins[iccid || imei];

        if (pin)
            delete data.pins[iccid || imei];

        data.release();

        if (pin && pinState === "SIM PIN" && tryLeft === 3) {
            debug(`Using stored pin ${pin} for unlocking dongle`);
            lockedModems.delete(imei);
            callback(pin);
        } else
            amiClient.postUserEventAction(
                UserEvent.Event.RequestUnlockCode.buildAction(
                    imei,
                    iccid,
                    pinState,
                    tryLeft.toString()
                )
            );

    }
);


amiClient.evtAmiUserEvent.attach(Request.matchEvt, async evtRequest => {

    let { actionid, command } = evtRequest;

    let replyError = (errorMessage: string) => amiClient.postUserEventAction(
        Response.buildAction(
            command,
            actionid,
            errorMessage
        )
    );

    if (Request.SendMessage.matchEvt(evtRequest)) {

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        let text = Request.SendMessage.reassembleText(evtRequest);

        let messageId = await modem.sendMessage(
            evtRequest.number,
            text
        );

        if (isNaN(messageId))
            return replyError("Message not send");

        amiClient.postUserEventAction(
            Response.SendMessage.buildAction(
                actionid,
                messageId.toString()
            )
        );
    } else if (Request.UpdateNumber.matchEvt(evtRequest)) {

        let { imei } = evtRequest;

        if (!activeModems.has(imei))
            return replyError(`Dongle imei: ${imei} not found`);

        let { modem, accessPoint } = activeModems.get(imei)!;

        await modem.writeNumber(evtRequest.number);

        amiClient.postUserEventAction(
            Response.buildAction(Request.UpdateNumber.keyword, actionid)
        );

        let id = "Dongle" + imei.substring(0, 3) + imei.substring(imei.length - 3);

        amiClient.postAction({
            "action": "DongleRestart",
            "device": id,
            "when": "gracefully"
        });

    } else if (Request.GetLockedDongles.matchEvt(evtRequest)) {


        await amiClient.postUserEventAction(
            Response.GetLockedDongles.Infos.buildAction(
                actionid,
                lockedModems.size.toString()
            )
        ).promise;

        for (let imei of lockedModems.keysAsArray()) {

            let { iccid, pinState, tryLeft } = lockedModems.get(imei)!;

            await amiClient.postUserEventAction(
                Response.GetLockedDongles.Entry.buildAction(
                    actionid,
                    imei,
                    iccid,
                    pinState,
                    tryLeft.toString()
                )
            ).promise;

        }


    } else if (Request.GetMessages.matchEvt(evtRequest)) {

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { imsi } = activeModems.get(evtRequest.imei)!.modem;

        let data = await Storage.read();

        let messages = data.messages[imsi] || [];

        if (evtRequest.flush === "true" && messages.length)
            delete data.messages[imsi];

        data.release();

        await amiClient.postUserEventAction(
            Response.GetMessages.Infos.buildAction(
                actionid,
                messages.length.toString()
            )
        ).promise;

        for (let { number, date, text } of messages)
            await amiClient.postUserEventAction(
                Response.GetMessages.Entry.buildAction(
                    actionid,
                    number,
                    date.toISOString(),
                    text
                )
            ).promise;


    } else if (Request.GetSimPhonebook.matchEvt(evtRequest)) {


        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        let contacts = modem.contacts;

        await amiClient.postUserEventAction(
            Response.GetSimPhonebook.Infos.buildAction(
                actionid,
                modem.contactNameMaxLength.toString(),
                modem.numberMaxLength.toString(),
                modem.storageLeft.toString(),
                contacts.length.toString()
            )
        ).promise;

        for (let { index, name, number } of contacts)
            await amiClient.postUserEventAction(
                Response.GetSimPhonebook.Entry.buildAction(
                    actionid,
                    index.toString(),
                    name,
                    number
                )
            ).promise;

    } else if (Request.CreateContact.matchEvt(evtRequest)) {

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        let { name, number } = evtRequest;

        //TODO: validate params.

        if (!modem.storageLeft)
            return replyError(`No storage space left on SIM`);

        let contact = await modem.createContact(number, name);

        amiClient.postUserEventAction(
            Response.CreateContact.buildAction(
                actionid,
                contact.index.toString(),
                contact.name,
                contact.number
            )
        );

    } else if (Request.DeleteContact.matchEvt(evtRequest)) {

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        let index = parseInt(evtRequest.index);

        if (!modem.getContact(index))
            return replyError(`Contact index ${index} does not exist`);

        await modem.deleteContact(index);

        amiClient.postUserEventAction(
            Response.buildAction(
                Request.DeleteContact.keyword,
                actionid
            )
        );

    } else if (Request.GetActiveDongles.matchEvt(evtRequest)) {

        await amiClient.postUserEventAction(
            Response.GetActiveDongles.Infos.buildAction(
                actionid,
                activeModems.size.toString()
            )
        ).promise;

        for (let imei of activeModems.keysAsArray()) {

            let { modem } = activeModems.get(imei)!;
            let { iccid, imsi, number, serviceProviderName } = modem;

            await amiClient.postUserEventAction(
                Response.GetActiveDongles.Entry.buildAction(
                    actionid,
                    imei,
                    iccid,
                    imsi,
                    number || "",
                    serviceProviderName || ""
                )
            ).promise;

        }

    } else if (Request.UnlockDongle.matchEvt(evtRequest)) {

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

        amiClient.postUserEventAction(
            Response.buildAction(
                Request.UnlockDongle.keyword,
                actionid
            )
        );


    } else
        return replyError(`Unknown command ${command}`);


});