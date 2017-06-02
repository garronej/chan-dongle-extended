import { activeModems, lockedModems } from "./main";
import * as appStorage from "./appStorage";

import { Ami } from "ts-ami";

import { 
    Event, 
    Response, 
    Request, 
    amiUser as user 
} from "./AmiUserEvents";


import * as dialplan from "./dialplan";

import * as _debug from "debug";
let debug = _debug("_main.ami");


let ami= Ami.localhost({ user });

//ami.evtUserEvent.attach(({ actionid, event, action, userevent, privilege, ...prettyEvt }) => debug(prettyEvt));

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

    ami.userEvent(
        Event.NewActiveDongle.build(
            imei,
            modem.iccid,
            modem.imsi,
            modem.number || "",
            modem.serviceProviderName || ""
        )
    );

    let { imsi } = modem;

    let dongleIdentifier: dialplan.DongleIdentifier= {
                "name": dongleName,
                "number": modem.number || "",
                imei,
                imsi,
                "provider": modem.serviceProviderName || ""
    };
    
    modem.evtMessageStatusReport.attach(async statusReport => {

        let {
            messageId,
            dischargeTime,
            isDelivered,
            status,
            recipient
        } = statusReport;

        ami.userEvent(
            Event.MessageStatusReport.build(
                imei,
                `${messageId}`,
                isNaN(dischargeTime.getTime()) ? `${dischargeTime}` : dischargeTime.toISOString(),
                isDelivered ? "true" : "false",
                status,
                recipient
            )
        )

        dialplan.notifyStatusReport( dongleIdentifier, statusReport );

    });

    modem.evtMessage.attach(async message => {

        debug("we got a message from modem");

        let appData = await appStorage.read();

        if (!appData.messages[imsi])
            appData.messages[imsi] = [];

        appData.messages[imsi].push(message);

        appData.release();

        let { number, date, text } = message;

        ami.userEvent(
            Event.NewMessage.build(
                imei,
                number,
                date.toISOString(),
                text
            )
        );


        dialplan.notifySms( dongleIdentifier, message);


    });


});


activeModems.evtDelete.attach(
    ([{ modem }]) => ami.userEvent(
        Event.DongleDisconnect.build(
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

        if (pin) delete appData.pins[iccid || imei];

        appData.release();

        if (pin && pinState === "SIM PIN" && tryLeft === 3) {
            debug(`Using stored pin ${pin} for unlocking dongle`);
            lockedModems.delete(imei);
            callback(pin);
        } else
            ami.userEvent(
                Event.RequestUnlockCode.build(
                    imei,
                    iccid,
                    pinState,
                    `${tryLeft}`
                )
            );

    }
);


ami.evtUserEvent.attach(Request.match, async evtRequest => {

    let { actionid, command } = evtRequest;

    let replyError = (errorMessage: string) => ami.userEvent(
        Response.build(
            actionid,
            errorMessage
        )
    );

    if (Request.SendMessage.match(evtRequest)) {

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        let text = Request.SendMessage.reassembleText(evtRequest);

        let messageId = await modem.sendMessage(
            evtRequest.number,
            text
        );

        if (isNaN(messageId)) return replyError("Message not send");

        ami.userEvent(
            Response.SendMessage.build(
                actionid,
                `${messageId}`
            )
        );

    } else if (Request.UpdateNumber.match(evtRequest)) {

        let { imei } = evtRequest;

        if (!activeModems.has(imei))
            return replyError(`Dongle imei: ${imei} not found`);

        let { modem, accessPoint } = activeModems.get(imei)!;

        await modem.writeNumber(evtRequest.number);

        ami.userEvent(
            Response.build(actionid)
        );


        ami.postAction(
            "DongleRestart",
            {
                "device": activeModems.get(imei)!.dongleName,
                "when": "gracefully"
            }
        );


    } else if (Request.GetLockedDongles.match(evtRequest)) {

        await ami.userEvent(
            Response.GetLockedDongles_first.build(
                actionid,
                `${lockedModems.size}`
            )
        );

        for (let imei of lockedModems.keysAsArray()) {

            let { iccid, pinState, tryLeft } = lockedModems.get(imei)!;

            await ami.userEvent(
                Response.GetLockedDongles_follow.build(
                    actionid,
                    imei,
                    iccid,
                    pinState,
                    `${tryLeft}`
                )
            );

        }


    } else if (Request.GetMessages.match(evtRequest)) {

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { imsi } = activeModems.get(evtRequest.imei)!.modem;

        let appData = await appStorage.read();

        let messages = appData.messages[imsi] || [];

        if (evtRequest.flush === "true" && messages.length)
            delete appData.messages[imsi];

        appData.release();

        await ami.userEvent(
            Response.GetMessages_first.build(
                actionid,
                `${messages.length}`
            )
        );

        for (let { number, date, text } of messages)
            await ami.userEvent(
                Response.GetMessages_follow.build(
                    actionid,
                    number,
                    date.toISOString(),
                    text
                )
            );


    } else if (Request.GetSimPhonebook.match(evtRequest)) {


        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        let contacts = modem.contacts;

        await ami.userEvent(
            Response.GetSimPhonebook_first.build(
                actionid,
                `${modem.contactNameMaxLength}`,
                `${modem.numberMaxLength}`,
                `${modem.storageLeft}`,
                `${contacts.length}`
            )
        );

        for (let { index, name, number } of contacts)
            await ami.userEvent(
                Response.GetSimPhonebook_follow.build(
                    actionid,
                    `${index}`,
                    name,
                    number
                )
            );

    } else if (Request.CreateContact.match(evtRequest)) {

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        let { name, number } = evtRequest;

        //TODO: validate params.

        if (!modem.storageLeft)
            return replyError(`No storage space left on SIM`);

        let contact = await modem.createContact(number, name);

        await ami.userEvent(
            Response.CreateContact.build(
                actionid,
                `${contact.index}`,
                contact.name,
                contact.number
            )
        );

    } else if (Request.DeleteContact.match(evtRequest)) {

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        let index = parseInt(evtRequest.index);

        if (!modem.getContact(index))
            return replyError(`Contact index ${index} does not exist`);

        await modem.deleteContact(index);

        await ami.userEvent(
            Response.build(
                actionid
            )
        );

    } else if (Request.GetActiveDongles.match(evtRequest)) {

        await ami.userEvent(
            Response.GetActiveDongles_first.build(
                actionid,
                `${activeModems.size}`
            )
        );

        for (let imei of activeModems.keysAsArray()) {

            let { modem } = activeModems.get(imei)!;
            let { iccid, imsi, number, serviceProviderName } = modem;

            await ami.userEvent(
                Response.GetActiveDongles_follow.build(
                    actionid,
                    imei,
                    iccid,
                    imsi,
                    number || "",
                    serviceProviderName || ""
                )
            );

        }

    } else if (Request.UnlockDongle.match(evtRequest)) {

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

        await ami.userEvent(
            Response.build(
                actionid
            )
        );


    } else
        return replyError(`Unknown command ${command}`);


});