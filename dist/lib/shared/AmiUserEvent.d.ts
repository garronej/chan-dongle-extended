import { AtMessage } from "../../../../ts-gsm-modem/dist/lib/index";
export interface UserEvent {
    userevent: string;
    actionid: string;
    [key: string]: string | undefined;
}
export declare namespace UserEvent {
    function buildAction(userevent: string, actionid?: string): UserEvent;
    interface Event extends UserEvent {
        userevent: typeof Event.keyword;
        dongleevent: string;
    }
    namespace Event {
        const keyword = "DongleExt Event";
        function matchEvt(evt: UserEvent): evt is Event;
        function buildAction(dongleevent: string): Event;
        interface RequestUnlockCode extends Event {
            dongleevent: typeof RequestUnlockCode.keyword;
            imei: string;
            iccid: string;
            pinstate: AtMessage.LockedPinState;
            tryleft: string;
        }
        namespace RequestUnlockCode {
            const keyword = "RequestUnlockCode";
            function matchEvt(evt: UserEvent): evt is RequestUnlockCode;
            function buildAction(imei: string, iccid: string, pinstate: AtMessage.LockedPinState, tryleft: string): RequestUnlockCode;
        }
        interface NewMessage extends Event {
            dongleevent: typeof NewMessage.keyword;
            imei: string;
            number: string;
            date: string;
            textsplitcount: string;
            [textn: string]: string;
        }
        namespace NewMessage {
            const keyword = "NewMessage";
            function matchEvt(evt: UserEvent): evt is NewMessage;
            function buildAction(imei: string, number: string, date: string, text: string): NewMessage;
            function reassembleText(evt: NewMessage): string;
        }
        interface NewActiveDongle extends Event {
            dongleevent: typeof NewActiveDongle.keyword;
            imei: string;
            iccid: string;
            imsi: string;
            number: string;
        }
        namespace NewActiveDongle {
            const keyword = "NewActiveDongle";
            function matchEvt(evt: UserEvent): evt is NewActiveDongle;
            function buildAction(imei: string, iccid: string, imsi: string, number: string): NewActiveDongle;
        }
        interface DongleDisconnect extends Event {
            dongleevent: typeof DongleDisconnect.keyword;
            imei: string;
            iccid: string;
            imsi: string;
            number: string;
        }
        namespace DongleDisconnect {
            const keyword = "DongleDisconnect";
            function matchEvt(evt: UserEvent): evt is DongleDisconnect;
            function buildAction(imei: string, iccid: string, imsi: string, number: string): DongleDisconnect;
        }
        interface MessageStatusReport extends Event {
            dongleevent: typeof MessageStatusReport.keyword;
            imei: string;
            messageid: string;
            dischargetime: string;
            isdelivered: "true" | "false";
            status: string;
        }
        namespace MessageStatusReport {
            const keyword = "MessageStatusReport";
            function matchEvt(evt: UserEvent): evt is MessageStatusReport;
            function buildAction(imei: string, messageid: string, dischargetime: string, isdelivered: MessageStatusReport['isdelivered'], status: string): MessageStatusReport;
        }
    }
    interface Request extends UserEvent {
        userevent: typeof Request.keyword;
        command: string;
    }
    namespace Request {
        const keyword = "DongleExt Request";
        function matchEvt(evt: UserEvent): evt is Request;
        function buildAction(command: string): Request;
        interface GetSimPhonebook extends Request {
            command: typeof GetSimPhonebook.keyword;
            imei: string;
        }
        namespace GetSimPhonebook {
            const keyword = "GetSimPhonebook";
            function matchEvt(evt: UserEvent): evt is GetSimPhonebook;
            function buildAction(imei: string): GetSimPhonebook;
        }
        interface DeleteContact extends Request {
            command: typeof DeleteContact.keyword;
            imei: string;
            index: string;
        }
        namespace DeleteContact {
            const keyword = "DeleteContact";
            function matchEvt(evt: UserEvent): evt is DeleteContact;
            function buildAction(imei: string, index: string): DeleteContact;
        }
        interface CreateContact extends Request {
            command: typeof CreateContact.keyword;
            imei: string;
            name: string;
            number: string;
        }
        namespace CreateContact {
            const keyword = "CreateContact";
            function matchEvt(evt: UserEvent): evt is CreateContact;
            function buildAction(imei: string, name: string, number: string): CreateContact;
        }
        interface GetMessages extends Request {
            command: typeof GetMessages.keyword;
            imei: string;
            flush: "true" | "false";
        }
        namespace GetMessages {
            const keyword = "GetMessages";
            function matchEvt(evt: UserEvent): evt is GetMessages;
            function buildAction(imei: string, flush: "true" | "false"): GetMessages;
        }
        interface SendMessage extends Request {
            command: typeof SendMessage.keyword;
            imei: string;
            number: string;
            text: string;
            textsplitcount: string;
            [textn: string]: string;
        }
        namespace SendMessage {
            const keyword = "SendMessage";
            function matchEvt(evt: UserEvent): evt is SendMessage;
            function buildAction(imei: string, number: string, text: string): SendMessage;
            function reassembleText(evt: SendMessage): string;
        }
        interface GetLockedDongles extends Request {
            command: typeof GetLockedDongles.keyword;
        }
        namespace GetLockedDongles {
            const keyword = "GetLockedDongles";
            function matchEvt(evt: UserEvent): evt is GetLockedDongles;
            function buildAction(): GetLockedDongles;
        }
        interface GetActiveDongles extends Request {
            command: typeof GetActiveDongles.keyword;
        }
        namespace GetActiveDongles {
            const keyword = "GetActiveDongles";
            function matchEvt(evt: UserEvent): evt is GetActiveDongles;
            function buildAction(): GetActiveDongles;
        }
        interface UnlockDongle extends Request {
            command: typeof UnlockDongle.keyword;
            imei: string;
            pin: string;
            puk: string;
            newpin: string;
        }
        namespace UnlockDongle {
            const keyword = "UnlockDongle";
            function matchEvt(evt: UserEvent): evt is UnlockDongle;
            function buildAction(imei: string, pin: string): UnlockDongle;
            function buildAction(imei: string, puk: string, newpin: string): UnlockDongle;
        }
    }
    interface Response extends UserEvent {
        userevent: typeof Response.keyword;
        responseto: string;
        error?: string;
    }
    namespace Response {
        const keyword = "DongleExt Response";
        function matchEvt(responseto: string, actionid: string): (evt: UserEvent) => evt is Response;
        function buildAction(responseto: string, actionid: string, error?: string): Response;
        interface SendMessage extends Response {
            responseto: typeof Request.SendMessage.keyword;
            messageid: string;
        }
        namespace SendMessage {
            function matchEvt(actionid: string): (evt: UserEvent) => evt is SendMessage;
            function buildAction(actionid: string, messageid: string): SendMessage;
        }
        interface CreateContact extends Response {
            responseto: typeof Request.CreateContact.keyword;
            index: string;
            name: string;
            number: string;
        }
        namespace CreateContact {
            function matchEvt(actionid: string): (evt: UserEvent) => evt is CreateContact;
            function buildAction(actionid: string, index: string, name: string, number: string): CreateContact;
        }
        interface GetSimPhonebook extends Response {
            responseto: typeof Request.GetSimPhonebook.keyword;
        }
        namespace GetSimPhonebook {
            function matchEvt(actionid: string): (evt: UserEvent) => evt is GetSimPhonebook;
            interface Infos extends GetSimPhonebook {
                contactnamemaxlength: string;
                numbermaxlength: string;
                storageleft: string;
                contactcount: string;
            }
            namespace Infos {
                function matchEvt(actionid: string): (evt: UserEvent) => evt is Infos;
                function buildAction(actionid: string, contactnamemaxlength: string, numbermaxlength: string, storageleft: string, contactcount: string): Infos;
            }
            interface Entry extends GetSimPhonebook {
                index: string;
                name: string;
                number: string;
            }
            namespace Entry {
                function matchEvt(actionid: string): (evt: UserEvent) => evt is Entry;
                function buildAction(actionid: string, index: string, name: string, number: string): Entry;
            }
        }
        interface GetLockedDongles extends Response {
            responseto: typeof Request.GetLockedDongles.keyword;
        }
        namespace GetLockedDongles {
            function matchEvt(actionid: string): (evt: UserEvent) => evt is GetLockedDongles;
            interface Infos extends GetLockedDongles {
                donglecount: string;
            }
            namespace Infos {
                function matchEvt(actionid: string): (evt: UserEvent) => evt is Infos;
                function buildAction(actionid: string, donglecount: string): Infos;
            }
            interface Entry extends GetLockedDongles {
                imei: string;
                iccid: string;
                pinstate: string;
                tryleft: string;
            }
            namespace Entry {
                function matchEvt(actionid: string): (evt: UserEvent) => evt is Entry;
                function buildAction(actionid: string, imei: string, iccid: string, pinstate: string, tryleft: string): Entry;
            }
        }
        interface GetMessages extends Response {
            responseto: typeof Request.GetMessages.keyword;
            messagescount: string;
            [messagen: string]: string | undefined;
        }
        namespace GetMessages {
            function matchEvt(actionid: string): (evt: UserEvent) => evt is GetMessages;
            function buildAction(actionid: string, messages: string[]): GetMessages;
            function reassembleMessage(evt: GetMessages): string[];
        }
        interface GetActiveDongles extends Response {
            responseto: typeof Request.GetActiveDongles.keyword;
        }
        namespace GetActiveDongles {
            function matchEvt(actionid: string): (evt: UserEvent) => evt is GetActiveDongles;
            interface Infos extends GetActiveDongles {
                donglecount: string;
            }
            namespace Infos {
                function matchEvt(actionid: string): (evt: UserEvent) => evt is Infos;
                function buildAction(actionid: string, donglecount: string): Infos;
            }
            interface Entry extends GetActiveDongles {
                imei: string;
                iccid: string;
                imsi: string;
                number: string;
            }
            namespace Entry {
                function matchEvt(actionid: string): (evt: UserEvent) => evt is Entry;
                function buildAction(actionid: string, imei: string, iccid: string, imsi: string, number: string): Entry;
            }
        }
    }
}
