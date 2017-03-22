import {
    AtMessage
} from "../../../../ts-gsm-modem/out/lib/index";

import { divide } from "../tools/divide";

export interface UserEvent {
    userevent: string;
    actionid: string;
    [key: string]: string | undefined;
}

export namespace UserEvent {

    export function buildAction(userevent: string, actionid?: string): UserEvent {

        actionid= actionid || Date.now().toString();

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

            export function buildAction(imei: string, number: string, date: string, text: string): NewMessage {

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

            export const keyword= "MessageStatusReport";

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

        export const keyword= "DongleExt Request";

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

            export const keyword= "GetSimPhonebook";

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

            export const keyword= "DeleteContact";

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

            export const keyword= "CreateContact";

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




        export interface SendMessage extends Request {
            command: typeof SendMessage.keyword;
            imei: string;
            number: string;
            text: string;
            textsplitcount: string;
            [textn: string]: string;
        }

        export namespace SendMessage {

            export const keyword= "SendMessage";

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

            export const keyword= "GetLockedDongles";

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

            export const keyword= "GetActiveDongles";

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

            export const keyword= "UnlockDongle";

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

        export const keyword= "DongleExt Response";

        export function matchEvt(evt: UserEvent, actionid: string): evt is Response {
            return (
                evt.actionid === actionid &&
                evt.userevent === keyword
            );
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
            responseto: typeof SendMessage.keyword;
            messageid: string;
        }

        export namespace SendMessage {

            export const keyword= "SendMessage"

            export function matchEvt(evt: UserEvent, actionid: string): evt is SendMessage {
                return (
                    Response.matchEvt(evt, actionid) &&
                    evt.responseto === keyword
                );
            }

            export function buildAction(actionid: string, messageid: string): SendMessage {
                return {
                    ...Response.buildAction(keyword, actionid),
                    messageid
                } as SendMessage;

            }
        }


        export interface CreateContact extends Response {
            responseto: typeof CreateContact.keyword;
            index: string;
            name: string;
            number: string;
        }

        export namespace CreateContact {

            export const keyword= "CreateContact";

            export function matchEvt(evt: UserEvent, actionid: string): evt is CreateContact {
                return (
                    Response.matchEvt(evt, actionid) &&
                    evt.responseto === keyword
                );
            }

            export function buildAction(actionid: string, index: string, name: string, number: string): CreateContact {
                return {
                    ...Response.buildAction(keyword, actionid),
                    index,
                    name,
                    number
                } as CreateContact;

            }
        }


        export interface GetSimPhonebook extends Response {
            responseto: typeof GetSimPhonebook.keyword;
            contactcount: string;
            [contactn: string]: string | undefined;
        }

        export namespace GetSimPhonebook {

            export const keyword= "GetSimPhonebook";

            export function matchEvt(evt: UserEvent, actionid: string): evt is GetSimPhonebook {
                return (
                    Response.matchEvt(evt, actionid) &&
                    evt.responseto === keyword
                );
            }

            export function buildAction( actionid: string, contacts: string[]): GetSimPhonebook {

                let out= {
                    ...Response.buildAction(keyword, actionid),
                    "contactcount": contacts.length.toString()
                } as GetSimPhonebook;

                for( let i=0; i< contacts.length; i++)
                    out[`contact${i}`] = contacts[i];
                
                return out;
            }

            export function reassembleContacts(evt: GetSimPhonebook): string[] {
                let out: string[]= [];

                for( let i=0; i< parseInt(evt.contactcount); i++)
                    out.push(evt[`contact${i}`]!);
                
                return out;
            }

        }





        export interface DeleteContact extends Response {
            responseto: typeof DeleteContact.keyword;
        }

        export namespace DeleteContact {
            
            export const keyword= "DeleteContact";

            export function matchEvt(evt: UserEvent, actionid: string): evt is DeleteContact {
                return (
                    Response.matchEvt(evt, actionid) &&
                    evt.responseto === keyword
                );
            }

            export function buildAction(actionid: string): DeleteContact {
                return {
                    ...Response.buildAction(keyword, actionid),
                } as DeleteContact;
            }

        }



        export interface GetLockedDongles extends Response {
            responseto: typeof GetLockedDongles.keyword;
            donglecount: string;
            [donglen: string]: string | undefined;
        }

        export namespace GetLockedDongles {

            export const keyword= "GetLockedDongles";

            export function matchEvt(evt: UserEvent, actionid: string): evt is GetLockedDongles {
                return (
                    Response.matchEvt(evt, actionid) &&
                    evt.responseto === keyword
                );
            }

            export function buildAction(actionid: string, dongles: string[]): GetLockedDongles {
                let out = {
                    ...Response.buildAction(keyword, actionid),
                    "donglecount": dongles.length.toString()
                } as GetLockedDongles;

                for (let i = 0; i < dongles.length; i++)
                    out[`dongle${i}`] = dongles[i];

                return out;
            }

            export function reassembleDongles(evt: GetLockedDongles): string[] {
                let out: string[] = [];

                for (let i = 0; i < parseInt(evt.donglecount); i++)
                    out.push(evt[`dongle${i}`]!);

                return out;

            }

        }






        export interface GetActiveDongles extends Response {
            responseto: typeof GetActiveDongles.keyword;
            donglecount: string;
            [donglen: string]: string | undefined;
        }

        export namespace GetActiveDongles {

            export const keyword= "GetActiveDongles";

            export function matchEvt(evt: UserEvent, actionid: string): evt is GetActiveDongles {
                return (
                    Response.matchEvt(evt, actionid) &&
                    evt.responseto === keyword
                );
            }

            export function buildAction(actionid: string, dongles: string[]): GetActiveDongles {
                let out = {
                    ...Response.buildAction(keyword, actionid),
                    "donglecount": dongles.length.toString()
                } as GetActiveDongles;

                for (let i = 0; i < dongles.length; i++)
                    out[`dongle${i}`] = dongles[i];

                return out;
            }

            export function reassembleDongles(evt: GetActiveDongles): string[] {
                let out: string[] = [];

                for (let i = 0; i < parseInt(evt.donglecount); i++)
                    out.push(evt[`dongle${i}`]!);

                return out;

            }

        }


    }

    /*END RESPONSE*/

}