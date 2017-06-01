import {
    Ami,
    UserEvent
} from "ts-ami";

import { Base64 } from "js-base64";

export type LockedPinState = "SIM PIN" | "SIM PUK" | "SIM PIN2" | "SIM PUK2";

export const amiUser= "dongle_ext_user";

const textKeyword = "base64text_part";

const maxMessageLength = 20000;

const usereventPrefix = "DongleAPI/";

export function buildUserEvent(
    userevent: string,
    actionid?: string
): UserEvent {

    actionid = actionid || Ami.generateUniqueActionId();

    return { userevent, actionid };

}

/*START EVENT*/

export interface Event extends UserEvent {
    userevent: typeof Event.userevent,
    dongleevent: string;
}

export namespace Event {

    export const userevent = `${usereventPrefix}Event`;

    export function match(evt: UserEvent): evt is Event {
        return evt.userevent === userevent;
    }

    export function build(dongleevent: string): Event {
        return {
            ...buildUserEvent(userevent),
            dongleevent
        } as Event;
    }


    export interface RequestUnlockCode extends Event {
        dongleevent: typeof RequestUnlockCode.dongleevent;
        imei: string;
        iccid: string;
        pinstate: LockedPinState;
        tryleft: string;
    }

    export namespace RequestUnlockCode {

        export const dongleevent = "RequestUnlockCode";

        export function match(evt: UserEvent): evt is RequestUnlockCode {
            return (
                Event.match(evt) &&
                evt.dongleevent === dongleevent
            );
        }

        export function build(
            imei: string,
            iccid: string,
            pinstate: LockedPinState,
            tryleft: string
        ): RequestUnlockCode {
            return {
                ...Event.build(dongleevent),
                imei,
                iccid,
                pinstate,
                tryleft
            } as RequestUnlockCode;
        }

    }

    export interface NewMessage extends Event {
        dongleevent: typeof NewMessage.dongleevent;
        imei: string;
        number: string;
        date: string;
        textsplitcount: string;
        [textn: string]: string;
    }

    export namespace NewMessage {

        export const dongleevent = "NewMessage";

        export function match(evt: UserEvent): evt is NewMessage {
            return (
                Event.match(evt) &&
                evt.dongleevent === dongleevent
            );
        }

        export function build(
            imei: string,
            number: string,
            date: string,
            text: string
        ): NewMessage {

            if (text.length > maxMessageLength)
                throw new Error("Message too long");

            let textParts = Ami.base64TextSplit(text, `${textKeyword}XX`);

            let out = {
                ...Event.build(dongleevent),
                imei,
                number,
                date,
                "textsplitcount": `${textParts.length}`
            } as NewMessage;

            for (let i = 0; i < textParts.length; i++)
                out[`${textKeyword}${i}`] = textParts[i];

            return out;
        }

        export function reassembleText(evt: NewMessage): string {
            let out = "";
            for (let i = 0; i < parseInt(evt.textsplitcount); i++)
                out += Base64.decode(evt[`${textKeyword}${i}`]);

            return out;

        }

    }


    export interface NewActiveDongle extends Event {
        dongleevent: typeof NewActiveDongle.dongleevent;
        imei: string;
        iccid: string;
        imsi: string;
        number: string;
        serviceprovider: string;
    }

    export namespace NewActiveDongle {

        export const dongleevent = "NewActiveDongle";

        export function match(evt: UserEvent): evt is NewActiveDongle {
            return (
                Event.match(evt) &&
                evt.dongleevent === dongleevent
            );
        }

        export function build(
            imei: string,
            iccid: string,
            imsi: string,
            number: string,
            serviceprovider: string
        ): NewActiveDongle {
            return {
                ...Event.build(dongleevent),
                imei,
                iccid,
                imsi,
                number,
                serviceprovider
            } as NewActiveDongle;
        }

    }

    export interface DongleDisconnect extends Event {
        dongleevent: typeof DongleDisconnect.dongleevent;
        imei: string;
        iccid: string;
        imsi: string;
        number: string;
        serviceprovider: string;
    }

    export namespace DongleDisconnect {

        export const dongleevent = "DongleDisconnect";

        export function match(evt: UserEvent): evt is DongleDisconnect {
            return (
                Event.match(evt) &&
                evt.dongleevent === dongleevent
            );
        }

        export function build(
            imei: string,
            iccid: string,
            imsi: string,
            number: string,
            serviceprovider: string
        ): DongleDisconnect {
            return {
                ...Event.build(dongleevent),
                imei,
                iccid,
                imsi,
                number,
                serviceprovider
            } as DongleDisconnect;
        }

    }




    export interface MessageStatusReport extends Event {
        dongleevent: typeof MessageStatusReport.dongleevent;
        imei: string;
        messageid: string;
        dischargetime: string;
        isdelivered: "true" | "false";
        status: string;
        recipient: string;
    }

    export namespace MessageStatusReport {

        export const dongleevent = "MessageStatusReport";

        export function match(evt: UserEvent): evt is MessageStatusReport {

            return (
                Event.match(evt) &&
                evt.dongleevent === dongleevent
            );

        }

        export function build(
            imei: string,
            messageid: string,
            dischargetime: string,
            isdelivered: MessageStatusReport['isdelivered'],
            status: string,
            recipient: string
        ): MessageStatusReport {

            return {
                ...Event.build(dongleevent),
                imei,
                messageid,
                dischargetime,
                isdelivered,
                status,
                recipient
            } as MessageStatusReport;

        }

    }

}

/*END EVENT*/

/*START REQUEST*/

export interface Request extends UserEvent {
    userevent: typeof Request.userevent;
    donglerequest: string;
}

export namespace Request {
    

    export const userevent = `${usereventPrefix}Request`;

    export function match(evt: UserEvent): evt is Request {
        return (
            evt.userevent === userevent &&
            "donglerequest" in evt
        );
    }

    export function build(donglerequest: string): Request {
        return {
            ...buildUserEvent(userevent),
            donglerequest
        } as Request;
    }

    export interface UpdateNumber extends Request {
        donglerequest: typeof UpdateNumber.donglerequest;
        imei: string;
        number: string;
    }

    export namespace UpdateNumber {

        export const donglerequest = "UpdateNumber";

        export function match(evt: UserEvent): evt is UpdateNumber {
            return (
                Request.match(evt) &&
                evt.donglerequest === donglerequest &&
                "imei" in evt &&
                "number" in evt
            );
        }

        export function build(imei: string, number: string): UpdateNumber {
            return {
                ...Request.build(donglerequest),
                imei,
                number
            } as UpdateNumber;
        }

    }


    export interface GetSimPhonebook extends Request {
        donglerequest: typeof GetSimPhonebook.donglerequest;
        imei: string;
    }

    export namespace GetSimPhonebook {

        export const donglerequest = "GetSimPhonebook";

        export function match(evt: UserEvent): evt is GetSimPhonebook {
            return (
                Request.match(evt) &&
                evt.donglerequest === donglerequest &&
                "imei" in evt
            );
        }

        export function build(imei: string): GetSimPhonebook {
            return {
                ...Request.build(donglerequest),
                imei
            } as GetSimPhonebook;
        }

    }



    export interface DeleteContact extends Request {
        donglerequest: typeof DeleteContact.donglerequest;
        imei: string;
        index: string;
    }


    export namespace DeleteContact {

        export const donglerequest = "DeleteContact";

        export function match(evt: UserEvent): evt is DeleteContact {
            return (
                Request.match(evt) &&
                evt.donglerequest === donglerequest &&
                "imei" in evt &&
                "index" in evt
            );
        }

        export function build(imei: string, index: string): DeleteContact {
            return {
                ...Request.build(donglerequest),
                imei,
                index
            } as DeleteContact;
        }

    }



    export interface CreateContact extends Request {
        donglerequest: typeof CreateContact.donglerequest;
        imei: string;
        name: string;
        number: string;
    }


    export namespace CreateContact {

        export const donglerequest = "CreateContact";

        export function match(evt: UserEvent): evt is CreateContact {
            return (
                Request.match(evt) &&
                evt.donglerequest === donglerequest &&
                "imei" in evt &&
                "name" in evt &&
                "number" in evt
            );
        }

        export function build(
            imei: string,
            name: string,
            number: string
        ): CreateContact {
            return {
                ...Request.build(donglerequest),
                imei,
                name,
                number
            } as CreateContact;
        }

    }



    export interface GetMessages extends Request {
        donglerequest: typeof GetMessages.donglerequest;
        imei: string;
        flush: "true" | "false";
    }

    export namespace GetMessages {

        export const donglerequest = "GetMessages";

        export function match(evt: UserEvent): evt is GetMessages {
            return (
                Request.match(evt) &&
                evt.donglerequest === donglerequest &&
                "imei" in evt &&
                (
                    evt.flush === "true" ||
                    evt.flush === "false"
                )
            );
        }

        export function build(
            imei: string,
            flush: "true" | "false"
        ): GetMessages {
            return {
                ...Request.build(donglerequest),
                imei,
                flush
            } as GetMessages;
        }

    }




    export interface SendMessage extends Request {
        donglerequest: typeof SendMessage.donglerequest;
        imei: string;
        number: string;
        text: string;
        textsplitcount: string;
        [textn: string]: string;
    }

    export namespace SendMessage {

        export const donglerequest = "SendMessage";

        export function match(evt: UserEvent): evt is SendMessage {
            return (
                Request.match(evt) &&
                evt.donglerequest === donglerequest &&
                "imei" in evt &&
                "number" in evt &&
                (
                    (
                        "textsplitcount" in evt && `${textKeyword}0` in evt
                    ) || "text" in evt
                )
            );
        }

        export function build(
            imei: string,
            number: string,
            text: string
        ): SendMessage {

            if (text.length > maxMessageLength)
                throw new Error("Message too long");

            let textParts = Ami.base64TextSplit(text, `${textKeyword}XX`);

            let out = {
                ...Request.build(donglerequest),
                imei,
                number,
                "textsplitcount": `${textParts.length}`
            } as SendMessage;

            for (let i = 0; i < textParts.length; i++)
                out[`${textKeyword}${i}`] = textParts[i];

            return out;

        }

        export function reassembleText(evt: SendMessage): string {

            if (evt.text) {
                try {
                    return JSON.parse(evt.text);
                } catch (error) {
                    return evt.text;
                }
            }

            let out = "";
            for (let i = 0; i < parseInt(evt.textsplitcount); i++)
                out += Base64.decode(evt[`${textKeyword}${i}`]);

            return out;
        }

    }

    export interface GetLockedDongles extends Request {
        donglerequest: typeof GetLockedDongles.donglerequest;
    }

    export namespace GetLockedDongles {

        export const donglerequest = "GetLockedDongles";

        export function match(evt: UserEvent): evt is GetLockedDongles {
            return (
                Request.match(evt) &&
                evt.donglerequest === donglerequest
            );
        }

        export function build(): GetLockedDongles {
            return {
                ...Request.build(donglerequest)
            } as GetLockedDongles;
        }

    }


    export interface GetActiveDongles extends Request {
        donglerequest: typeof GetActiveDongles.donglerequest;
    }

    export namespace GetActiveDongles {

        export const donglerequest = "GetActiveDongles";

        export function match(evt: UserEvent): evt is GetActiveDongles {
            return (
                Request.match(evt) &&
                evt.donglerequest === donglerequest
            );
        }

        export function build(): GetActiveDongles {
            return {
                ...Request.build(donglerequest)
            } as GetActiveDongles;
        }

    }



    export interface UnlockDongle extends Request {
        donglerequest: typeof UnlockDongle.donglerequest;
        imei: string;
        pin: string;
        puk: string;
        newpin: string;
    }

    export namespace UnlockDongle {

        export const donglerequest = "UnlockDongle";

        export function match(evt: UserEvent): evt is UnlockDongle {
            return (
                Request.match(evt) &&
                evt.donglerequest === donglerequest &&
                "imei" in evt &&
                "pin" in evt !== ("puk" in evt && "newpin" in evt)
            );
        }

        export function build(imei: string, pin: string): UnlockDongle;
        export function build(imei: string, puk: string, newpin: string): UnlockDongle;
        export function build(...inputs: any[]): any {

            let base = {
                ...Request.build(donglerequest),
                "imei": inputs[0]
            };

            if (inputs.length === 2)
                return { ...base, "pin": inputs[1] };
            else
                return { ...base, "puk": inputs[1], "newpin": inputs[2] };

        }

    }


}

/*END REQUEST*/

/*START RESPONSE*/

export interface Response extends UserEvent {
    userevent: typeof Response.userevent;
    error?: string
}

export namespace Response {

    export const userevent = "DongleExt Response";

    export function match(actionid: string) {
        return (evt: UserEvent): evt is Response => {
            return (
                evt.actionid === actionid &&
                evt.userevent === userevent
            );
        }
    }

    export function build(
        actionid: string,
        error?: string
    ): Response {
        let out = buildUserEvent(userevent, actionid);

        if (typeof error === "string") out = { ...out, error };

        return out as Response;
    }




    export interface SendMessage extends Response {
        messageid: string;
    }

    export namespace SendMessage {

        export function match(actionid: string) {
            return (evt: UserEvent): evt is SendMessage =>
                Response.match(actionid)(evt);
        }


        export function build(actionid: string, messageid: string): SendMessage {
            return {
                ...Response.build(actionid),
                messageid
            } as SendMessage;
        }
    }


    export interface CreateContact extends Response {
        index: string;
        name: string;
        number: string;
    }

    export namespace CreateContact {

        export function match(actionid: string) {
            return (evt: UserEvent): evt is CreateContact =>
                Response.match(actionid)(evt);
        }

        export function build(actionid: string, index: string, name: string, number: string): CreateContact {
            return {
                ...Response.build(actionid),
                index,
                name,
                number
            } as CreateContact;

        }
    }




    export interface GetSimPhonebook_first extends Response {
        contactnamemaxlength: string;
        numbermaxlength: string;
        storageleft: string;
        contactcount: string;
    }

    export namespace GetSimPhonebook_first {

        export function match(actionid: string) {
            return (evt: UserEvent): evt is GetSimPhonebook_first => {
                return (
                    Response.match(actionid)(evt) &&
                    ("contactcount" in evt || "error" in evt)
                );
            };
        }

        export function build(
            actionid: string,
            contactnamemaxlength: string,
            numbermaxlength: string,
            storageleft: string,
            contactcount: string
        ): GetSimPhonebook_first {

            return {
                ...Response.build(actionid),
                contactnamemaxlength,
                numbermaxlength,
                storageleft,
                contactcount
            } as GetSimPhonebook_first;

        }

    }

    export interface GetSimPhonebook_follow extends Response {
        index: string;
        name: string;
        number: string;
    }

    export namespace GetSimPhonebook_follow {

        export function match(actionid: string) {
            return (evt: UserEvent): evt is GetSimPhonebook_follow => {
                return (
                    Response.match(actionid)(evt) &&
                    !GetSimPhonebook_first.match(actionid)(evt)
                );
            };
        }

        export function build(
            actionid: string,
            index: string,
            name: string,
            number: string
        ): GetSimPhonebook_follow {
            return {
                ...Response.build(actionid),
                index,
                name,
                number
            } as GetSimPhonebook_follow;
        }
    }










    export interface GetLockedDongles_first extends Response {
        donglecount: string;
    }

    export namespace GetLockedDongles_first {

        export function match(actionid: string) {
            return (evt: UserEvent): evt is GetLockedDongles_first =>
                (
                    Response.match(actionid)(evt) &&
                    "donglecount" in evt
                );
        }

        export function build(actionid: string, donglecount: string): GetLockedDongles_first {
            return {
                ...Response.build(actionid),
                donglecount
            } as GetLockedDongles_first;
        }

    }


    export interface GetLockedDongles_follow extends Response {
        imei: string;
        iccid: string;
        pinstate: string;
        tryleft: string;
    }

    export namespace GetLockedDongles_follow {

        export function match(actionid: string) {
            return (evt: UserEvent): evt is GetLockedDongles_follow =>
                (
                    Response.match(actionid)(evt) &&
                    !GetLockedDongles_first.match(actionid)(evt)
                );
        }

        export function build(
            actionid: string,
            imei: string,
            iccid: string,
            pinstate: string,
            tryleft: string
        ): GetLockedDongles_follow {
            return {
                ...Response.build(actionid),
                imei,
                iccid,
                pinstate,
                tryleft
            } as GetLockedDongles_follow;

        }

    }






    export interface GetMessages_first extends Response {
        messagescount: string;
    }

    export namespace GetMessages_first {

        export function match(actionid: string) {
            return (evt: UserEvent): evt is GetMessages_first =>
                (
                    Response.match(actionid)(evt) &&
                    ("messagescount" in evt || "error" in evt)
                );
        }

        export function build(actionid: string, messagescount: string): GetMessages_first {
            return {
                ...Response.build(actionid),
                messagescount
            } as GetMessages_first;
        }

    }

    export interface GetMessages_follow extends Response {
        number: string;
        date: string;
        textsplitcount: string;
        [textn: string]: string | undefined;
    }

    export namespace GetMessages_follow {

        export function match(actionid: string) {
            return (evt: UserEvent): evt is GetMessages_follow =>
                (
                    Response.match(actionid)(evt) &&
                    !GetMessages_first.match(actionid)(evt)
                );
        }


        export function build(
            actionid: string,
            number: string,
            date: string,
            text: string
        ): GetMessages_follow {

            if (text.length > maxMessageLength)
                throw new Error("Message too long");

            let textParts = Ami.base64TextSplit(text, `${textKeyword}XX`);

            let out = {
                ...Response.build(Request.GetMessages.donglerequest, actionid),
                number,
                date,
                "textsplitcount": `${textParts.length}`,
            } as GetMessages_follow;

            for (let i = 0; i < textParts.length; i++)
                out[`${textKeyword}${i}`] = textParts[i];

            return out;
        }

        export function reassembleText(evt: GetMessages_follow): string {
            let out = "";
            for (let i = 0; i < parseInt(evt.textsplitcount); i++)
                out += Base64.decode(evt[`${textKeyword}${i}`]!);

            return out;
        }

    }









    export interface GetActiveDongles_first extends Response {
        donglecount: string;
    }

    export namespace GetActiveDongles_first {

        export function match(actionid: string) {
            return (evt: UserEvent): evt is GetActiveDongles_first =>
                (
                    Response.match(actionid)(evt) &&
                    "donglecount" in evt
                );
        }

        export function build(actionid: string, donglecount: string): GetActiveDongles_first {
            return {
                ...Response.build(actionid),
                donglecount
            } as GetActiveDongles_first;
        }

    }


    export interface GetActiveDongles_follow extends Response {
        imei: string;
        iccid: string;
        imsi: string;
        number: string;
        serviceprovider: string;
    }

    export namespace GetActiveDongles_follow {

        export function match(actionid: string) {
            return (evt: UserEvent): evt is GetActiveDongles_follow =>
                (
                    Response.match(actionid)(evt) &&
                    !GetActiveDongles_first.match(actionid)(evt)
                );
        }

        export function build(
            actionid: string,
            imei: string,
            iccid: string,
            imsi: string,
            number: string,
            serviceprovider: string
        ): GetActiveDongles_follow {
            return {
                ...Response.build(actionid),
                imei,
                iccid,
                imsi,
                number,
                serviceprovider
            } as GetActiveDongles_follow;
        }

    }



}

/*END RESPONSE*/
