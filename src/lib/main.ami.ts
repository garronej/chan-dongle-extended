import {
    activeModems,
    lockedModems,
    getDongleName,
    storeSimPin
} from "./main";
import * as appStorage from "./appStorage";

import { Ami } from "ts-ami";

import {
    Event,
    Response,
    Request,
    amiUser as user
} from "../chan-dongle-extended-client";

import * as dialplan from "./dialplan";

import { chanDongleConfManager } from "./chanDongleConfManager";

import * as _debug from "debug";
let debug = _debug("_main.ami");


let ami = Ami.localhost({ user });

//ami.evtUserEvent.attach(({ actionid, event, action, userevent, privilege, ...prettyEvt }) => debug(prettyEvt));

activeModems.evtSet.attach(
    async ([modem, accessPoint]) => {

        let dongleName = getDongleName(accessPoint);
        let imei = modem.imei;

        debug(`New active modem ${imei}`);

        storeSimPin(modem);

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

        let dongleIdentifier: dialplan.DongleIdentifier = {
            "name": dongleName,
            "number": modem.number || "",
            imei,
            imsi,
            "provider": modem.serviceProviderName || ""
        };

        modem.evtMessageStatusReport.attach(async statusReport => {

            let { messageId, dischargeTime, isDelivered, status, recipient } = statusReport;

            ami.userEvent(
                Event.MessageStatusReport.build(
                    imei,
                    imsi,
                    `${messageId}`,
                    isNaN(dischargeTime.getTime()) ? `${dischargeTime}` : dischargeTime.toISOString(),
                    isDelivered ? "true" : "false",
                    status,
                    recipient
                )
            )

            dialplan.notifyStatusReport(dongleIdentifier, statusReport);

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
                    imsi,
                    number,
                    date.toISOString(),
                    text
                )
            );

            dialplan.notifySms(dongleIdentifier, message);

        });


    }
);

activeModems.evtDelete.attach(
    ([modem]) => ami.userEvent(
        Event.ActiveDongleDisconnect.build(
            modem.imei,
            modem.iccid,
            modem.imsi,
            modem.number || "",
            modem.serviceProviderName || ""
        )
    )
);

lockedModems.evtSet.attach(
    async ([lockedModem, accessPoint]) => {

        let { imei, iccid, pinState, tryLeft, callback, evtDisconnect } = lockedModem;

        evtDisconnect.attachOnce(() => {

            ami.userEvent(
                Event.LockedDongleDisconnect.build(
                    imei,
                    iccid,
                    pinState,
                    `${tryLeft}`
                )
            );

            lockedModems.delete(accessPoint);

        });

        lockedModems.evtDelete.attachOnce(
            ([lockedModem]) => lockedModem.imei === imei,
            () => evtDisconnect.detach()
        );

        debug(`Locked modem IMEI: ${imei},ICCID: ${iccid}, ${pinState}, ${tryLeft}`);

        let appData = await appStorage.read();

        let pin = appData.pins[iccid || imei];

        if (pin && pinState === "SIM PIN" && tryLeft === 3) {
            debug(`Using stored pin ${pin} for unlocking dongle`);
            lockedModems.delete(accessPoint);
            callback(pin);
        } else {

            if (pin) delete appData.pins[iccid || imei];

            ami.userEvent(
                Event.RequestUnlockCode.build(
                    imei,
                    iccid,
                    pinState,
                    `${tryLeft}`
                )
            );

        }

        appData.release();

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

        let { imei } = evtRequest;

        let modem = activeModems.find(modem => modem.imei === imei);

        if (!modem)
            return replyError(`Dongle imei: ${imei} not found`);

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

        let modem = activeModems.find(modem => modem.imei === imei);

        if (!modem)
            return replyError(`Dongle imei: ${imei} not found`);

        await modem.writeNumber(evtRequest.number);

        ami.userEvent(
            Response.build(actionid)
        );

        ami.postAction(
            "DongleRestart",
            {
                "device": getDongleName(activeModems.keyOf(modem)!),
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

        for (let lockedModem of lockedModems.values()) {

            let { imei, iccid, pinState, tryLeft } = lockedModem;

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

        let { imei } = evtRequest;

        let modem = activeModems.find(modem => modem.imei === imei);

        if (!modem)
            return replyError(`Dongle imei: ${imei} not found`);

        let { imsi } = modem;

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

        let { imei } = evtRequest;

        let modem = activeModems.find(modem => modem.imei === imei);

        if (!modem)
            return replyError(`Dongle imei: ${imei} not found`);

        let {
            contactNameMaxLength,
            numberMaxLength,
            storageLeft,
            contacts
        } = modem;

        await ami.userEvent(
            Response.GetSimPhonebook_first.build(
                actionid,
                `${contactNameMaxLength}`,
                `${numberMaxLength}`,
                `${storageLeft}`,
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

        let { imei } = evtRequest;

        let modem = activeModems.find(modem => modem.imei === imei);

        if (!modem)
            return replyError(`Dongle imei: ${imei} not found`);

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

        let { imei } = evtRequest;

        let modem = activeModems.find(modem => modem.imei === imei);

        if (!modem)
            return replyError(`Dongle imei: ${imei} not found`);

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

        for (let modem of activeModems.values()) {

            let { imei, iccid, imsi, number, serviceProviderName } = modem;

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

        let lockedModem = lockedModems.find(
            lockedModem => lockedModem.imei === imei
        );

        if (!lockedModem)
            return replyError(`Dongle imei: ${imei} not found`);

        let { pinState } = lockedModem;
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

        lockedModems.delete(lockedModems.keyOf(lockedModem)!);

        await ami.userEvent(
            Response.build(
                actionid
            )
        );

    } else if (Request.GetConfig.match(evtRequest)) {

        await ami.userEvent(
            Response.GetConfig.build(
                actionid,
                chanDongleConfManager.getConfig()
            )
        );

    } else
        return replyError(`Unknown command ${command}`);

});