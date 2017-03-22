import { activeModems, lockedModems } from "./main";
import { AmiService } from "./lib/AmiService";
import { UserEvent } from "../shared/AmiUserEvent";
import { Storage } from "./lib/Storage";


import { DongleActive, LockedDongle } from "../client/AmiClient";

import * as _debug from "debug";
let debug = _debug("_main.ami");

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

    AmiService.postEvent(
        UserEvent.Event.NewActiveDongle.buildAction(
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
        }) => AmiService.postEvent(
                UserEvent.Event.MessageStatusReport.buildAction(
                    imei,
                    messageId.toString(),
                    dischargeTime.toISOString(),
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
                    date.toISOString(),
                    text
                )
            )
    );


});


activeModems.evtDelete.attach(
    ([{ modem }, imei]) => AmiService.postEvent(
        UserEvent.Event.DongleDisconnect.buildAction(
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
            AmiService.postEvent(
                UserEvent.Event.RequestUnlockCode.buildAction(
                    imei,
                    iccid,
                    pinState,
                    tryLeft.toString()
                )
            );

    }
);


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

        let text = UserEvent.Request.SendMessage.reassembleText(evtRequest);

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

    } else if (UserEvent.Request.GetLockedDongles.matchEvt(evtRequest)) {

        let dongles: LockedDongle[] = [];

        for (let imei of lockedModems.keysAsArray()) {
            let { iccid, pinState, tryLeft } = lockedModems.get(imei)!;
            dongles.push({ imei, iccid, pinState, tryLeft });
        }

        callback(
            UserEvent.Response.GetLockedDongles.buildAction(
                actionid,
                dongles.map( value => JSON.stringify(value) )
            )
        );
    } else if (UserEvent.Request.GetSimPhonebook.matchEvt(evtRequest)) {

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        callback(
            UserEvent.Response.GetSimPhonebook.buildAction(
                actionid,
                modem.contactNameMaxLength.toString(),
                modem.numberMaxLength.toString(),
                modem.storageLeft.toString(),
                modem.contacts.map( value => JSON.stringify( value ) )
            )
        );
    } else if (UserEvent.Request.CreateContact.matchEvt(evtRequest)) {

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        let { name, number } = evtRequest;

        //TODO: validate params.

        if( !modem.storageLeft )
            return replyError(`No storage space left on SIM`);

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
    } else if (UserEvent.Request.DeleteContact.matchEvt(evtRequest)) {

        if (!activeModems.has(evtRequest.imei))
            return replyError(`Dongle imei: ${evtRequest.imei} not found`);

        let { modem } = activeModems.get(evtRequest.imei)!;

        let index = parseInt(evtRequest.index);

        if (!modem.getContact(index))
            return replyError(`Contact index ${index} does not exist`);

        modem.deleteContact(index,
            () => callback(
                UserEvent.Response.DeleteContact.buildAction(
                    actionid
                )
            )
        );

    } else if (UserEvent.Request.GetActiveDongles.matchEvt(evtRequest)) {

        let dongles: DongleActive[] = [];

        for (let imei of activeModems.keysAsArray()) {

            let { modem } = activeModems.get(imei)!;
            let { iccid, imsi, number } = modem;

            dongles.push({ imei, iccid, imsi, number });

        }

        callback(
            UserEvent.Response.GetActiveDongles.buildAction(
                evtRequest.actionid,
                dongles.map( value => JSON.stringify( value ))
            )
        );

    } else if (UserEvent.Request.UnlockDongle.matchEvt(evtRequest)) {

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