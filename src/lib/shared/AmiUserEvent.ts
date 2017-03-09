import {
    LockedPinState
} from "../../../../ts-gsm-modem/out/lib/index";

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
        userevent: "DongleExt Event",
        dongleevent: string;
    }

    export namespace Event {

        export function matchEvt(evt: UserEvent): evt is Event {
            return (
                evt.userevent === "DongleExt Event"
            );
        }

        export function buildAction(dongleevent: string): Event {
            return {
                ...UserEvent.buildAction("DongleExt Event"),
                dongleevent
            } as Event;
        }


        export interface RequestUnlockCode extends Event {
            dongleevent: "RequestUnlockCode";
            imei: string;
            pinstate: LockedPinState;
            tryleft: string;
        }

        export namespace RequestUnlockCode {

            export function matchEvt(evt: UserEvent): evt is RequestUnlockCode {
                return (
                    Event.matchEvt(evt) &&
                    evt.dongleevent === "RequestUnlockCode"
                )
            }

            export function buildAction(imei: string, pinstate: LockedPinState, tryleft: string): RequestUnlockCode {
                return {
                    ...Event.buildAction("RequestUnlockCode"),
                    imei,
                    pinstate,
                    tryleft
                } as RequestUnlockCode;
            }

        }

        export interface NewMessage extends Event {
            dongleevent: "NewMessage";
            imei: string;
            number: string;
            date: string;
            text: string;
        }

        export namespace NewMessage{

            export function matchEvt(evt: UserEvent): evt is NewMessage {
                return (
                    Event.matchEvt(evt) &&
                    evt.dongleevent === "NewMessage"
                );
            }

            export function buildAction(imei: string, number: string, date: string, text: string): NewMessage {
                return {
                    ...Event.buildAction("NewMessage"),
                    imei,
                    number,
                    date,
                    text
                } as NewMessage;
            }

        }


        export interface NewActiveDongle extends Event {
            dongleevent: "NewActiveModem";
            imei: string;
        }

        export namespace NewActiveDongle {

            export function matchEvt(evt: UserEvent): evt is NewActiveDongle {
                return (
                    Event.matchEvt(evt) &&
                    evt.dongleevent === "NewActiveModem"
                );
            }

            export function buildAction(imei: string): NewActiveDongle {
                return {
                    ...Event.buildAction("NewActiveModem"),
                    imei
                } as NewActiveDongle;
            }

        }

        export interface DongleDisconnect extends Event {
            dongleevent: "DongleDisconnect";
            imei: string;
        }

        export namespace DongleDisconnect {

            export function matchEvt(evt: UserEvent): evt is DongleDisconnect {
                return (
                    Event.matchEvt(evt) &&
                    evt.dongleevent === "DongleDisconnect"
                );
            }

            export function buildAction(imei: string): DongleDisconnect {
                return {
                    ...Event.buildAction("DongleDisconnect"),
                    imei
                } as DongleDisconnect;
            }
        }



        export interface MessageStatusReport extends Event {
            dongleevent: "MessageStatusReport";
            imei: string;
            messageid: string;
            dischargetime: string;
            isdelivered: "true" | "false";
            status: string;
        }

        export namespace MessageStatusReport {

            export function matchEvt(evt: UserEvent): evt is MessageStatusReport {

                return (
                    Event.matchEvt(evt) &&
                    evt.dongleevent === "MessageStatusReport"
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
                    ...Event.buildAction("MessageStatusReport"),
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
        userevent: "DongleExt Request";
        command: string;
    }

    export namespace Request {

        export function matchEvt(evt: UserEvent): evt is Request {
            return (
                evt.userevent === "DongleExt Request" &&
                evt.hasOwnProperty("command")
            );
        }

        export function buildAction(command: string): Request {
            return {
                ...UserEvent.buildAction("DongleExt Request"),
                command
            } as Request;
        }


        export interface GetSimPhonebook extends Request{
            command: "GetSimPhonebook";
            imei: string;
        }

        export namespace GetSimPhonebook {

            export function matchEvt(evt: UserEvent): evt is GetSimPhonebook {
                return (
                    Request.matchEvt(evt) &&
                    evt.command === "GetSimPhonebook" &&
                    evt.hasOwnProperty("imei")
                );
            }

            export function buildAction(imei: string): GetSimPhonebook {
                return {
                    ...Request.buildAction("GetSimPhonebook"),
                    imei
                } as GetSimPhonebook;
            }

        }



        export interface DeleteContact extends Request{
            command: "DeleteContact";
            imei: string;
            index: string;
        }


        export namespace DeleteContact {

            export function matchEvt(evt: UserEvent): evt is DeleteContact {
                return (
                    Request.matchEvt(evt) &&
                    evt.command === "DeleteContact" &&
                    evt.hasOwnProperty("imei") &&
                    evt.hasOwnProperty("index")
                );
            }

            export function buildAction(imei: string, index: string): DeleteContact {
                return {
                    ...Request.buildAction("DeleteContact"),
                    imei,
                    index
                } as DeleteContact;
            }

        }



        export interface CreateContact extends Request{
            command: "CreateContact";
            imei: string;
            name: string;
            number: string;
        }


        export namespace CreateContact {

            export function matchEvt(evt: UserEvent): evt is CreateContact {
                return (
                    Request.matchEvt(evt) &&
                    evt.command === "CreateContact" &&
                    evt.hasOwnProperty("imei") &&
                    evt.hasOwnProperty("name") &&
                    evt.hasOwnProperty("number")
                );
            }

            export function buildAction(imei: string, name: string, number: string): CreateContact {
                return {
                    ...Request.buildAction("CreateContact"),
                    imei,
                    name,
                    number
                } as CreateContact;
            }

        }




        export interface SendMessage extends Request {
            command: "SendMessage";
            imei: string;
            number: string;
            text: string;
        }

        export namespace SendMessage {

            export function matchEvt(evt: UserEvent): evt is SendMessage {
                return (
                    Request.matchEvt(evt) &&
                    evt.command === "SendMessage" &&
                    evt.hasOwnProperty("imei") &&
                    evt.hasOwnProperty("number") &&
                    evt.hasOwnProperty("text")
                );
            }

            export function buildAction(imei: string, number: string, text: string): SendMessage {
                return {
                    ...Request.buildAction("SendMessage"),
                    imei, number, text
                } as SendMessage;
            }

        }

        export interface GetLockedDongles extends Request {
            command: "GetLockedDongles";
        }

        export namespace GetLockedDongles {

            export function matchEvt(evt: UserEvent): evt is GetLockedDongles {
                return (
                    Request.matchEvt(evt) &&
                    evt.command === "GetLockedDongles"
                );
            }

            export function buildAction(): GetLockedDongles {
                return {
                    ...Request.buildAction("GetLockedDongles")
                } as GetLockedDongles;
            }

        }


        export interface GetActiveDongles extends Request {
            command: "GetActiveDongles";
        }

        export namespace GetActiveDongles {

            export function matchEvt(evt: UserEvent): evt is GetActiveDongles {
                return (
                    Request.matchEvt(evt) &&
                    evt.command === "GetActiveDongles"
                );
            }

            export function buildAction(): GetActiveDongles {
                return {
                    ...Request.buildAction("GetActiveDongles")
                } as GetActiveDongles;
            }

        }



        export interface UnlockDongle extends Request {
            command: "UnlockDongle";
            imei: string;
            pin: string;
            puk: string;
            newpin: string;
        }

        export namespace UnlockDongle {

            export function matchEvt(evt: UserEvent): evt is UnlockDongle {
                return (
                    Request.matchEvt(evt) &&
                    evt.command === "UnlockDongle" &&
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
                    ...Request.buildAction("UnlockDongle"),
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
        userevent: "DongleExt Response";
        responseto: string;
        error?: string
    }

    export namespace Response {

        export function matchEvt(evt: UserEvent, actionid: string): evt is Response {
            return (
                evt.actionid === actionid &&
                evt.userevent === "DongleExt Response"
            );
        }

        export function buildAction(responseto: string, actionid: string, error?: string): Response {
            let out = {
                ...UserEvent.buildAction("DongleExt Response", actionid),
                responseto
            } as Response;

            if (typeof error === "string") out.error = error;

            return out;
        }

        export interface SendMessage extends Response {
            responseto: "SendMessage";
            messageid: string;
        }

        export namespace SendMessage {

            export function matchEvt(evt: UserEvent, actionid: string): evt is SendMessage {
                return (
                    Response.matchEvt(evt, actionid) &&
                    evt.responseto === "SendMessage"
                );
            }

            export function buildAction(actionid: string, messageid: string): SendMessage {
                return {
                    ...Response.buildAction("SendMessage", actionid),
                    messageid
                } as SendMessage;

            }
        }


        export interface CreateContact extends Response {
            responseto: "CreateContact";
            index: string;
            name: string;
            number: string;
        }

        export namespace CreateContact {

            export function matchEvt(evt: UserEvent, actionid: string): evt is CreateContact {
                return (
                    Response.matchEvt(evt, actionid) &&
                    evt.responseto === "CreateContact"
                );
            }

            export function buildAction(actionid: string, index: string, name: string, number: string): CreateContact {
                return {
                    ...Response.buildAction("CreateContact", actionid),
                    index,
                    name,
                    number
                } as CreateContact;

            }
        }

        export interface GetSimPhonebook extends Response {
            responseto: "GetSimPhonebook";
            phonebookpart1: string;
            phonebookpart2: string;
            phonebookpart3: string;
        }

        export namespace GetSimPhonebook {

            export function matchEvt(evt: UserEvent, actionid: string): evt is GetSimPhonebook {
                return (
                    Response.matchEvt(evt, actionid) &&
                    evt.responseto === "GetSimPhonebook"
                );
            }

            export function buildAction(
                actionid: string,
                phonebookpart1: string,
                phonebookpart2: string,
                phonebookpart3: string
            ): GetSimPhonebook {
                return {
                    ...Response.buildAction("GetSimPhonebook", actionid),
                    phonebookpart1,
                    phonebookpart2,
                    phonebookpart3
                } as GetSimPhonebook;
            }

        }



        export interface GetLockedDongles extends Response {
            responseto: "GetLockedDongles";
            dongles: string;
        }

        export namespace GetLockedDongles {

            export function matchEvt(evt: UserEvent, actionid: string): evt is GetLockedDongles {
                return (
                    Response.matchEvt(evt, actionid) &&
                    evt.responseto === "GetLockedDongles"
                );
            }

            export function buildAction(actionid: string, dongles: string): GetLockedDongles {
                return {
                    ...Response.buildAction("GetLockedDongles", actionid),
                    dongles
                } as GetLockedDongles;
            }

        }


        export interface DeleteContact extends Response {
            responseto: "DeleteContact";
        }

        export namespace DeleteContact {

            export function matchEvt(evt: UserEvent, actionid: string): evt is DeleteContact {
                return (
                    Response.matchEvt(evt, actionid) &&
                    evt.responseto === "DeleteContact"
                );
            }

            export function buildAction(actionid: string): DeleteContact {
                return {
                    ...Response.buildAction("DeleteContact", actionid),
                } as DeleteContact;
            }

        }


        export interface GetActiveDongles extends Response {
            responseto: "GetActiveDongles";
            dongles: string;
        }

        export namespace GetActiveDongles {

            export function matchEvt(evt: UserEvent, actionid: string): evt is GetActiveDongles {
                return (
                    Response.matchEvt(evt, actionid) &&
                    evt.responseto === "GetActiveDongles"
                );
            }

            export function buildAction(actionid: string, dongles: string): GetActiveDongles {
                return {
                    ...Response.buildAction("GetActiveDongles", actionid),
                    dongles
                } as GetActiveDongles;
            }

        }


    }

    /*END RESPONSE*/

}