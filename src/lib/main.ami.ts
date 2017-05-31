import { activeModems, lockedModems } from "./main";
import { appStorage } from "./appStorage";
import { 
    DongleExtendedClient, 
    UserEvent, 
    DongleActive, 
    LockedDongle
} from "chan-dongle-extended-client";

import Event= UserEvent.Event;
import Response= UserEvent.Response;
import Request= UserEvent.Request;

import * as dialplan from "./dialplan";

import * as _debug from "debug";
let debug = _debug("_main.ami");

const client= DongleExtendedClient.localhost();



client.evtUserEvent.attach(({ actionid, event, action, userevent, privilege, ...prettyEvt }) => debug(prettyEvt));

activeModems.evtSet.attach(async ([{ modem, dongleName }, imei]) => {

    debug(`New active modem ${imei}`);

    if (modem.pin) {

        debug(`Persistent storing of pin: ${modem.pin}`);

        if (modem.iccidAvailableBeforeUnlock)
            debug(`for SIM ICCID: ${modem.iccid}`);
        else
            debug(`for dongle IMEI: ${modem.imei}, because SIM ICCID is not readable with this dongle when SIM is locked`);

        let appData = await appStorage.read();

        appData.pins[modem.iccidAvailableBeforeUnlock ? modem.iccid : modem.imei] = modem.pin;

        appData.release();


    }

    client.postUserEventAction(
        Event.NewActiveDongle.buildAction(
            imei,
            modem.iccid,
            modem.imsi,
            modem.number || "",
            modem.serviceProviderName || ""
        )
    );

    let { imsi } = modem;
    
    modem.evtMessageStatusReport.attach(async statusReport => {

        let {
            messageId,
            dischargeTime,
            isDelivered,
            status,
            recipient
        } = statusReport;

        client.postUserEventAction(
            Event.MessageStatusReport.buildAction(
                imei,
                messageId.toString(),
                dischargeTime.toISOString(),
                isDelivered ? "true" : "false",
                status,
                recipient
            )
        )

        dialplan.notifyStatusReport(
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

        debug(" we got a message from modem");

        let appData = await appStorage.read();


        if (!appData.messages[imsi])
            appData.messages[imsi] = [];

        appData.messages[imsi].push(message);

        appData.release();

        let { number, date, text } = message;

        client.postUserEventAction(
            UserEvent.Event.NewMessage.buildAction(
                imei,
                number,
                date.toISOString(),
                text
            )
        );


        dialplan.notifySms(
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
    ([{ modem }]) => client.postUserEventAction(
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

        let appData = await appStorage.read();

        let pin = appData.pins[iccid || imei];

        if (pin)
            delete appData.pins[iccid || imei];

        appData.release();

        if (pin && pinState === "SIM PIN" && tryLeft === 3) {
            debug(`Using stored pin ${pin} for unlocking dongle`);
            lockedModems.delete(imei);
            callback(pin);
        } else
            client.postUserEventAction(
                UserEvent.Event.RequestUnlockCode.buildAction(
                    imei,
                    iccid,
                    pinState,
                    tryLeft.toString()
                )
            );

    }
);


client.evtUserEvent.attach(Request.matchEvt, async evtRequest => {

    let { actionid, command } = evtRequest;

    let replyError = (errorMessage: string) => client.postUserEventAction(
        Response.buildAction(
            command,
            actionid,
            errorMessage
        )
    );

    if (Request.SendMessage.matchEvt(evtRequest)) {

        debug("======>", { evtRequest } );

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        let text = Request.SendMessage.reassembleText(evtRequest);

        debug("on send le message avec modem");

        let messageId = await modem.sendMessage(
            evtRequest.number,
            text
        );


        if (isNaN(messageId))
            return replyError("Message not send");

        client.postUserEventAction(
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

        client.postUserEventAction(
            Response.buildAction(Request.UpdateNumber.keyword, actionid)
        );

        let id = "Dongle" + imei.substring(0, 3) + imei.substring(imei.length - 3);

        client.ami.postAction({
            "action": "DongleRestart",
            "device": id,
            "when": "gracefully"
        });

    } else if (Request.GetLockedDongles.matchEvt(evtRequest)) {

        await client.postUserEventAction(
            Response.GetLockedDongles.Infos.buildAction(
                actionid,
                lockedModems.size.toString()
            )
        );

        for (let imei of lockedModems.keysAsArray()) {

            let { iccid, pinState, tryLeft } = lockedModems.get(imei)!;

            await client.postUserEventAction(
                Response.GetLockedDongles.Entry.buildAction(
                    actionid,
                    imei,
                    iccid,
                    pinState,
                    tryLeft.toString()
                )
            );

        }


    } else if (Request.GetMessages.matchEvt(evtRequest)) {

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { imsi } = activeModems.get(evtRequest.imei)!.modem;

        let appData = await appStorage.read();

        let messages = appData.messages[imsi] || [];

        if (evtRequest.flush === "true" && messages.length)
            delete appData.messages[imsi];

        appData.release();

        await client.postUserEventAction(
            Response.GetMessages.Infos.buildAction(
                actionid,
                messages.length.toString()
            )
        );

        for (let { number, date, text } of messages)
            await client.postUserEventAction(
                Response.GetMessages.Entry.buildAction(
                    actionid,
                    number,
                    date.toISOString(),
                    text
                )
            );


    } else if (Request.GetSimPhonebook.matchEvt(evtRequest)) {


        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        let contacts = modem.contacts;

        await client.postUserEventAction(
            Response.GetSimPhonebook.Infos.buildAction(
                actionid,
                modem.contactNameMaxLength.toString(),
                modem.numberMaxLength.toString(),
                modem.storageLeft.toString(),
                contacts.length.toString()
            )
        );

        for (let { index, name, number } of contacts)
            await client.postUserEventAction(
                Response.GetSimPhonebook.Entry.buildAction(
                    actionid,
                    index.toString(),
                    name,
                    number
                )
            );

    } else if (Request.CreateContact.matchEvt(evtRequest)) {

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        let { name, number } = evtRequest;

        //TODO: validate params.

        if (!modem.storageLeft)
            return replyError(`No storage space left on SIM`);

        let contact = await modem.createContact(number, name);

        client.postUserEventAction(
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

        client.postUserEventAction(
            Response.buildAction(
                Request.DeleteContact.keyword,
                actionid
            )
        );

    } else if (Request.GetActiveDongles.matchEvt(evtRequest)) {

        await client.postUserEventAction(
            Response.GetActiveDongles.Infos.buildAction(
                actionid,
                activeModems.size.toString()
            )
        );

        for (let imei of activeModems.keysAsArray()) {

            let { modem } = activeModems.get(imei)!;
            let { iccid, imsi, number, serviceProviderName } = modem;

            await client.postUserEventAction(
                Response.GetActiveDongles.Entry.buildAction(
                    actionid,
                    imei,
                    iccid,
                    imsi,
                    number || "",
                    serviceProviderName || ""
                )
            );

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

        client.postUserEventAction(
            Response.buildAction(
                Request.UnlockDongle.keyword,
                actionid
            )
        );


    } else
        return replyError(`Unknown command ${command}`);


});