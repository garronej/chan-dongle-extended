import {
    AtMessage
} from "../../../../ts-gsm-modem/dist/lib/index";

import { divide } from "../tools/divide";

export interface UserEvent {
    userevent: string;
    actionid: string;
    [key: string]: string | undefined;
}


let counter= Date.now();

export namespace UserEvent {


    export function buildAction(userevent: string, actionid?: string): UserEvent {

        actionid= actionid || (counter++).toString();

        return {
            "action": "UserEvent",
            userevent,
            actionid
        };

    }

    /*START EVENT*/

    export interface Event extends UserEvent {
        userevent: typeof Event.keyword,
        dongleevent: string;
    }

    export namespace Event {

        export const keyword= "DongleExt Event";

        export function matchEvt(evt: UserEvent): evt is Event {
            return (
                evt.userevent === keyword
            );
        }

        export function buildAction(dongleevent: string): Event {
            return {
                ...UserEvent.buildAction(keyword),
                dongleevent
            } as Event;
        }


        export interface RequestUnlockCode extends Event {
            dongleevent: typeof RequestUnlockCode.keyword;
            imei: string;
            iccid: string;
            pinstate: AtMessage.LockedPinState;
            tryleft: string;
        }

        export namespace RequestUnlockCode {

            export const keyword = "RequestUnlockCode";

            export function matchEvt(evt: UserEvent): evt is RequestUnlockCode {
                return (
                    Event.matchEvt(evt) &&
                    evt.dongleevent === keyword
                )
            }

            export function buildAction(
                imei: string,
                iccid: string,
                pinstate: AtMessage.LockedPinState,
                tryleft: string
            ): RequestUnlockCode {
                return {
                    ...Event.buildAction(keyword),
                    imei,
                    iccid,
                    pinstate,
                    tryleft
                } as RequestUnlockCode;
            }

        }

        export interface NewMessage extends Event {
            dongleevent: typeof NewMessage.keyword;
            imei: string;
            number: string;
            date: string;
            textsplitcount: string;
            [textn: string]: string;
        }

        export namespace NewMessage {

            export const keyword = "NewMessage";

            export function matchEvt(evt: UserEvent): evt is NewMessage {
                return (
                    Event.matchEvt(evt) &&
                    evt.dongleevent === keyword
                );
            }

            export function buildAction(
                imei: string,
                number: string,
                date: string,
                text: string
            ): NewMessage {

                let textParts = divide(500, text);

                let out = {
                    ...Event.buildAction(keyword),
                    imei,
                    number,
                    date,
                    "textsplitcount": textParts.length.toString(),
                } as NewMessage;

                for (let i = 0; i < textParts.length; i++)
                    out[`text${i}`] = JSON.stringify(textParts[i]);

                return out;
            }

            export function reassembleText(evt: NewMessage): string {
                let out = "";
                for (let i = 0; i < parseInt(evt.textsplitcount); i++)
                    out += JSON.parse(evt[`text${i}`]);

                return out;
            }

        }


        export interface NewActiveDongle extends Event {
            dongleevent: typeof NewActiveDongle.keyword;
            imei: string;
            iccid: string;
            imsi: string;
            number: string;
        }

        export namespace NewActiveDongle {

            export const keyword = "NewActiveDongle";

            export function matchEvt(evt: UserEvent): evt is NewActiveDongle {
                return (
                    Event.matchEvt(evt) &&
                    evt.dongleevent === keyword
                );
            }

            export function buildAction(
                imei: string,
                iccid: string,
                imsi: string,
                number: string
            ): NewActiveDongle {
                return {
                    ...Event.buildAction(keyword),
                    imei,
                    iccid,
                    imsi,
                    number
                } as NewActiveDongle;
            }

        }

        export interface DongleDisconnect extends Event {
            dongleevent: typeof DongleDisconnect.keyword;
            imei: string;
            iccid: string;
            imsi: string;
            number: string;
        }

        export namespace DongleDisconnect {

            export const keyword = "DongleDisconnect";

            export function matchEvt(evt: UserEvent): evt is DongleDisconnect {
                return (
                    Event.matchEvt(evt) &&
                    evt.dongleevent === keyword
                );
            }

            export function buildAction(
                imei: string,
                iccid: string,
                imsi: string,
                number: string
            ): DongleDisconnect {
                return {
                    ...Event.buildAction(keyword),
                    imei,
                    iccid,
                    imsi,
                    number
                } as DongleDisconnect;
            }

        }




        export interface MessageStatusReport extends Event {
            dongleevent: typeof MessageStatusReport.keyword;
            imei: string;
            messageid: string;
            dischargetime: string;
            isdelivered: "true" | "false";
            status: string;
        }

        export namespace MessageStatusReport {

            export const keyword = "MessageStatusReport";

            export function matchEvt(evt: UserEvent): evt is MessageStatusReport {

                return (
                    Event.matchEvt(evt) &&
                    evt.dongleevent === keyword
                );

            }

            export function buildAction(
                imei: string,
                messageid: string,
                dischargetime: string,
                isdelivered: MessageStatusReport['isdelivered'],
                status: string
            ): MessageStatusReport {

                return {
                    ...Event.buildAction(keyword),
                    imei,
                    messageid,
                    dischargetime,
                    isdelivered,
                    status
                } as MessageStatusReport;

            }

        }

    }

    /*END EVENT*/

    /*START REQUEST*/

    export interface Request extends UserEvent {
        userevent: typeof Request.keyword;
        command: string;
    }

    export namespace Request {

        export const keyword = "DongleExt Request";

        export function matchEvt(evt: UserEvent): evt is Request {
            return (
                evt.userevent === keyword &&
                evt.hasOwnProperty("command")
            );
        }

        export function buildAction(command: string): Request {
            return {
                ...UserEvent.buildAction(keyword),
                command
            } as Request;
        }


        export interface GetSimPhonebook extends Request {
            command: typeof GetSimPhonebook.keyword;
            imei: string;
        }

        export namespace GetSimPhonebook {

            export const keyword = "GetSimPhonebook";

            export function matchEvt(evt: UserEvent): evt is GetSimPhonebook {
                return (
                    Request.matchEvt(evt) &&
                    evt.command === keyword &&
                    evt.hasOwnProperty("imei")
                );
            }

            export function buildAction(imei: string): GetSimPhonebook {
                return {
                    ...Request.buildAction(keyword),
                    imei
                } as GetSimPhonebook;
            }

        }



        export interface DeleteContact extends Request {
            command: typeof DeleteContact.keyword;
            imei: string;
            index: string;
        }


        export namespace DeleteContact {

            export const keyword = "DeleteContact";

            export function matchEvt(evt: UserEvent): evt is DeleteContact {
                return (
                    Request.matchEvt(evt) &&
                    evt.command === keyword &&
                    evt.hasOwnProperty("imei") &&
                    evt.hasOwnProperty("index")
                );
            }

            export function buildAction(imei: string, index: string): DeleteContact {
                return {
                    ...Request.buildAction(keyword),
                    imei,
                    index
                } as DeleteContact;
            }

        }



        export interface CreateContact extends Request {
            command: typeof CreateContact.keyword;
            imei: string;
            name: string;
            number: string;
        }


        export namespace CreateContact {

            export const keyword = "CreateContact";

            export function matchEvt(evt: UserEvent): evt is CreateContact {
                return (
                    Request.matchEvt(evt) &&
                    evt.command === keyword &&
                    evt.hasOwnProperty("imei") &&
                    evt.hasOwnProperty("name") &&
                    evt.hasOwnProperty("number")
                );
            }

            export function buildAction(imei: string, name: string, number: string): CreateContact {
                return {
                    ...Request.buildAction(keyword),
                    imei,
                    name,
                    number
                } as CreateContact;
            }

        }



        export interface GetMessages extends Request {
            command: typeof GetMessages.keyword;
            imei: string;
            flush: "true" | "false";
        }

        export namespace GetMessages {

            export const keyword = "GetMessages";

            export function matchEvt(evt: UserEvent): evt is GetMessages {
                return (
                    Request.matchEvt(evt) &&
                    evt.command === keyword &&
                    evt.hasOwnProperty("imei") &&
                    (
                        evt.flush === "true" ||
                        evt.flush === "false"
                    )
                );
            }

            export function buildAction(
                imei: string,
                flush: "true" | "false"
            ): GetMessages {
                return {
                    ...Request.buildAction(keyword),
                    imei,
                    flush
                } as GetMessages;
            }

        }




        export interface SendMessage extends Request {
            command: typeof SendMessage.keyword;
            imei: string;
            number: string;
            text: string;
            textsplitcount: string;
            [textn: string]: string;
        }

        export namespace SendMessage {

            export const keyword = "SendMessage";

            export function matchEvt(evt: UserEvent): evt is SendMessage {
                return (
                    Request.matchEvt(evt) &&
                    evt.command === keyword &&
                    evt.hasOwnProperty("imei") &&
                    evt.hasOwnProperty("number") &&
                    (
                        (
                            evt.hasOwnProperty("textsplitcount") &&
                            evt.hasOwnProperty("text0")
                        ) || evt.hasOwnProperty("text")
                    )
                );
            }

            export function buildAction(imei: string, number: string, text: string): SendMessage {

                let textParts = divide(500, text);

                let out = {
                    ...Request.buildAction(keyword),
                    imei,
                    number,
                    "textsplitcount": textParts.length.toString()
                } as SendMessage;

                for (let i = 0; i < textParts.length; i++)
                    out[`text${i}`] = JSON.stringify(textParts[i]);

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
                    out += JSON.parse(evt[`text${i}`]);

                return out;
            }

        }

        export interface GetLockedDongles extends Request {
            command: typeof GetLockedDongles.keyword;
        }

        export namespace GetLockedDongles {

            export const keyword = "GetLockedDongles";

            export function matchEvt(evt: UserEvent): evt is GetLockedDongles {
                return (
                    Request.matchEvt(evt) &&
                    evt.command === keyword
                );
            }

            export function buildAction(): GetLockedDongles {
                return {
                    ...Request.buildAction(keyword)
                } as GetLockedDongles;
            }

        }


        export interface GetActiveDongles extends Request {
            command: typeof GetActiveDongles.keyword;
        }

        export namespace GetActiveDongles {

            export const keyword = "GetActiveDongles";

            export function matchEvt(evt: UserEvent): evt is GetActiveDongles {
                return (
                    Request.matchEvt(evt) &&
                    evt.command === keyword
                );
            }

            export function buildAction(): GetActiveDongles {
                return {
                    ...Request.buildAction(keyword)
                } as GetActiveDongles;
            }

        }



        export interface UnlockDongle extends Request {
            command: typeof UnlockDongle.keyword;
            imei: string;
            pin: string;
            puk: string;
            newpin: string;
        }

        export namespace UnlockDongle {

            export const keyword = "UnlockDongle";

            export function matchEvt(evt: UserEvent): evt is UnlockDongle {
                return (
                    Request.matchEvt(evt) &&
                    evt.command === keyword &&
                    evt.hasOwnProperty("imei") &&
                    (
                        evt.hasOwnProperty("pin") !==
                        (evt.hasOwnProperty("puk") && evt.hasOwnProperty("newpin"))
                    )
                );
            }

            export function buildAction(imei: string, pin: string): UnlockDongle;
            export function buildAction(imei: string, puk: string, newpin: string): UnlockDongle;
            export function buildAction(...inputs: any[]): any {

                let base = {
                    ...Request.buildAction(keyword),
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
        userevent: typeof Response.keyword;
        responseto: string;
        error?: string
    }

    export namespace Response {

        export const keyword = "DongleExt Response";

        export function matchEvt(responseto: string, actionid: string) {
            return (evt: UserEvent): evt is Response => {
                return (
                    evt.actionid === actionid &&
                    evt.userevent === keyword &&
                    evt.responseto === responseto
                );
            }
        }

        export function buildAction(responseto: string, actionid: string, error?: string): Response {
            let out = {
                ...UserEvent.buildAction(keyword, actionid),
                responseto
            } as Response;

            if (typeof error === "string") out.error = error;

            return out;
        }




        export interface SendMessage extends Response {
            responseto: typeof Request.SendMessage.keyword;
            messageid: string;
        }

        export namespace SendMessage {

            export function matchEvt(actionid: string) {
                return (evt: UserEvent): evt is SendMessage =>
                    Response.matchEvt(Request.SendMessage.keyword, actionid)(evt);
            }


            export function buildAction(actionid: string, messageid: string): SendMessage {
                return {
                    ...Response.buildAction(Request.SendMessage.keyword, actionid),
                    messageid
                } as SendMessage;

            }
        }


        export interface CreateContact extends Response {
            responseto: typeof Request.CreateContact.keyword;
            index: string;
            name: string;
            number: string;
        }

        export namespace CreateContact {

            export function matchEvt(actionid: string) {
                return (evt: UserEvent): evt is CreateContact =>
                    Response.matchEvt(Request.CreateContact.keyword, actionid)(evt);
            }

            export function buildAction(actionid: string, index: string, name: string, number: string): CreateContact {
                return {
                    ...Response.buildAction(Request.CreateContact.keyword, actionid),
                    index,
                    name,
                    number
                } as CreateContact;

            }
        }




        export interface GetSimPhonebook extends Response {
            responseto: typeof Request.GetSimPhonebook.keyword;
        }



        export namespace GetSimPhonebook {

            export function matchEvt(actionid: string) {
                return (evt: UserEvent): evt is GetSimPhonebook =>
                    Response.matchEvt(Request.GetSimPhonebook.keyword, actionid)(evt);
            }


            export interface Infos extends GetSimPhonebook {
                contactnamemaxlength: string;
                numbermaxlength: string;
                storageleft: string;
                contactcount: string;
            }

            export namespace Infos {

                export function matchEvt(actionid: string) {
                    return (evt: UserEvent): evt is Infos => {
                        return (
                            Response.GetSimPhonebook.matchEvt(actionid)(evt) &&
                            (
                                evt.hasOwnProperty("contactcount") ||
                                evt.hasOwnProperty("error")
                            )
                        );
                    };
                }


                export function buildAction(
                    actionid: string,
                    contactnamemaxlength: string,
                    numbermaxlength: string,
                    storageleft: string,
                    contactcount: string
                ): Infos {

                    return {
                        ...Response.buildAction(Request.GetSimPhonebook.keyword, actionid),
                        contactnamemaxlength,
                        numbermaxlength,
                        storageleft,
                        contactcount
                    } as Infos;

                }

            }

            export interface Entry extends GetSimPhonebook {
                index: string;
                name: string;
                number: string;
            }

            export namespace Entry {

                export function matchEvt(actionid: string) {
                    return (evt: UserEvent): evt is Entry => {
                        return (
                            Response.GetSimPhonebook.matchEvt(actionid)(evt) &&
                            evt.hasOwnProperty("index")
                        );
                    };
                }

                export function buildAction(
                    actionid: string,
                    index: string,
                    name: string,
                    number: string
                ): Entry {
                    return {
                        ...Response.buildAction(Request.GetSimPhonebook.keyword, actionid),
                        index,
                        name,
                        number
                    } as Entry;
                }
            }


        }






        export interface GetLockedDongles extends Response {
            responseto: typeof Request.GetLockedDongles.keyword;
        }

        export namespace GetLockedDongles {

            export function matchEvt(actionid: string) {
                return (evt: UserEvent): evt is GetLockedDongles =>
                    Response.matchEvt(Request.GetLockedDongles.keyword, actionid)(evt);
            }

            export interface Infos extends GetLockedDongles {
                donglecount: string;
            }

            export namespace Infos {

                export function matchEvt(actionid: string) {
                    return (evt: UserEvent): evt is Infos =>
                        (
                            GetLockedDongles.matchEvt(actionid)(evt) &&
                            evt.hasOwnProperty("donglecount")
                        );
                }

                export function buildAction(actionid: string, donglecount: string): Infos {
                    return {
                        ...Response.buildAction(Request.GetLockedDongles.keyword, actionid),
                        donglecount
                    } as Infos;
                }

            }


            export interface Entry extends GetLockedDongles {
                imei: string;
                iccid: string;
                pinstate: string;
                tryleft: string;
            }

            export namespace Entry {

                export function matchEvt(actionid: string) {
                    return (evt: UserEvent): evt is Entry =>
                        (
                            GetLockedDongles.matchEvt(actionid)(evt) &&
                            !GetLockedDongles.Infos.matchEvt(actionid)(evt)
                        );
                }

                export function buildAction(
                    actionid: string,
                    imei: string,
                    iccid: string,
                    pinstate: string,
                    tryleft: string
                ): Entry {
                    return {
                        ...Response.buildAction(Request.GetLockedDongles.keyword, actionid),
                        imei,
                        iccid,
                        pinstate,
                        tryleft
                    } as Entry;

                }

            }
        }

        export interface GetMessages extends Response {
            responseto: typeof Request.GetMessages.keyword;
            messagescount: string;
            [messagen: string]: string | undefined;
        }

        export namespace GetMessages {

            export function matchEvt(actionid: string) {
                return (evt: UserEvent): evt is GetMessages =>
                    Response.matchEvt(Request.GetMessages.keyword, actionid)(evt);
            }


            export function buildAction(actionid: string, messages: string[]): GetMessages {
                let out = {
                    ...Response.buildAction(Request.GetMessages.keyword, actionid),
                    "messagescount": messages.length.toString()
                } as GetMessages;

                for (let i = 0; i < messages.length; i++)
                    out[`message${i}`] = messages[i];

                return out;
            }

            export function reassembleMessage(evt: GetMessages): string[] {
                let out: string[] = [];

                for (let i = 0; i < parseInt(evt.messagescount); i++)
                    out.push(evt[`message${i}`]!);

                return out;

            }

        }



        export interface GetActiveDongles extends Response {
            responseto: typeof Request.GetActiveDongles.keyword;
        }

        export namespace GetActiveDongles {

            export function matchEvt(actionid: string) {
                return (evt: UserEvent): evt is GetActiveDongles =>
                    Response.matchEvt(Request.GetActiveDongles.keyword, actionid)(evt);
            }

            export interface Infos extends GetActiveDongles {
                donglecount: string;
            }

            export namespace Infos {

                export function matchEvt(actionid: string) {
                    return (evt: UserEvent): evt is Infos =>
                        (
                            GetActiveDongles.matchEvt(actionid)(evt) &&
                            evt.hasOwnProperty("donglecount")
                        );
                }

                export function buildAction(actionid: string, donglecount: string): Infos {
                    return {
                        ...Response.buildAction(Request.GetActiveDongles.keyword, actionid),
                        donglecount
                    } as Infos;
                }

            }


            export interface Entry extends GetActiveDongles {
                imei: string;
                iccid: string;
                imsi: string;
                number: string;
            }

            export namespace Entry {

                export function matchEvt(actionid: string) {
                    return (evt: UserEvent): evt is Entry =>
                        (
                            GetActiveDongles.matchEvt(actionid)(evt) &&
                            !GetActiveDongles.Infos.matchEvt(actionid)(evt)
                        );
                }

                export function buildAction(actionid: string, imei: string, iccid: string, imsi: string, number: string): Entry {
                    return {
                        ...Response.buildAction(Request.GetActiveDongles.keyword, actionid),
                        imei,
                        iccid,
                        imsi,
                        number
                    } as Entry;

                }

            }

        }



    }

    /*END RESPONSE*/

}