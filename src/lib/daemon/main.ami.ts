import { activeModems, lockedModems } from "./main";
import { UserEvent } from "../shared/AmiUserEvent";
import Event= UserEvent.Event;
import Response= UserEvent.Response;
import Request= UserEvent.Request;

import { Storage } from "./lib/Storage";
import { AmiClient } from "../client/AmiClient";


import { DongleActive, LockedDongle } from "../client/AmiClient";

import * as _debug from "debug";
let debug = _debug("_main.ami");

const amiClient= AmiClient.localhost();

//ami.keepConnected();

amiClient.evtAmiUserEvent.attach(({ actionid, event, action, userevent, privilege, ...prettyEvt }) => debug(prettyEvt));

activeModems.evtSet.attach(async ([{ modem }, imei]) => {

    debug(`New active modem ${imei}`);

    if (modem.pin) {

        debug(`Persistent storing of pin: ${modem.pin}`);

        if (modem.iccidAvailableBeforeUnlock)
            debug(`for SIM ICCID: ${modem.iccid}`);
        else
            debug(`for dongle IMEI: ${modem.imei}, because SIM ICCID is not readable with this dongle when SIM is locked`);

        let data = await Storage.read();

        data.pins[modem.iccidAvailableBeforeUnlock ? modem.iccid : modem.imei] = modem.pin;

        await Storage.write(data);


    }

    amiClient.postUserEventAction(
        Event.NewActiveDongle.buildAction(
            imei,
            modem.iccid,
            modem.imsi,
            modem.number || ""
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

    modem.evtMessage.attach( async message => {

        let data= await Storage.read();

        let { imsi }= modem;

        if( !data.messages[imsi] ) 
            data.messages[imsi]= [];

        data.messages[imsi].push(message);

        await Storage.write(data);

        let { number, date, text } = message;

        amiClient.postUserEventAction(
            UserEvent.Event.NewMessage.buildAction(
                imei,
                number,
                date.toISOString(),
                text
            )
        );

    });


});


activeModems.evtDelete.attach(
    ([{ modem }, imei]) => amiClient.postUserEventAction(
        Event.DongleDisconnect.buildAction(
            imei,
            modem.iccid,
            modem.imsi,
            modem.number || ""
        )
    )
);


lockedModems.evtSet.attach(
    async ([{ iccid, pinState, tryLeft, callback }, imei]) => {

        debug(`Locked modem IMEI: ${imei},ICCID: ${iccid}, ${pinState}, ${tryLeft}`);

        let data = await Storage.read();

        let pin = data.pins[iccid || imei];

        if (pin) {

            delete data.pins[iccid || imei];

            await Storage.write(data);

        }

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

        console.log("before storage read", imsi);

        let data = await Storage.read();

        console.log(data.messages[imsi]);

        //TODO
        /*
        callback(
            UserEvent.Response.GetMessages.buildAction(
                actionid,
                (data.messages[imsi] || []).map(value => JSON.stringify(value))
            )
        );
        */

        if (evtRequest.flush === "true" && data.messages[imsi]) {
            delete data.messages[imsi];
            Storage.write(data);
        }

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
        
        let contact= await modem.createContact(number, name);

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
            let { iccid, imsi, number } = modem;

            await amiClient.postUserEventAction(
                Response.GetActiveDongles.Entry.buildAction(
                    actionid,
                    imei,
                    iccid,
                    imsi,
                    number || ""
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