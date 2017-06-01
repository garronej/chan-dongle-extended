import { UserEvent } from "ts-ami";
export declare type LockedPinState = "SIM PIN" | "SIM PUK" | "SIM PIN2" | "SIM PUK2";
export declare const amiUser = "dongle_ext_user";
export declare function buildUserEvent(userevent: string, actionid?: string): UserEvent;
export interface Event extends UserEvent {
    userevent: typeof Event.userevent;
    dongleevent: string;
}
export declare namespace Event {
    const userevent: string;
    function match(evt: UserEvent): evt is Event;
    function build(dongleevent: string): Event;
    interface RequestUnlockCode extends Event {
        dongleevent: typeof RequestUnlockCode.dongleevent;
        imei: string;
        iccid: string;
        pinstate: LockedPinState;
        tryleft: string;
    }
    namespace RequestUnlockCode {
        const dongleevent = "RequestUnlockCode";
        function match(evt: UserEvent): evt is RequestUnlockCode;
        function build(imei: string, iccid: string, pinstate: LockedPinState, tryleft: string): RequestUnlockCode;
    }
    interface NewMessage extends Event {
        dongleevent: typeof NewMessage.dongleevent;
        imei: string;
        number: string;
        date: string;
        textsplitcount: string;
        [textn: string]: string;
    }
    namespace NewMessage {
        const dongleevent = "NewMessage";
        function match(evt: UserEvent): evt is NewMessage;
        function build(imei: string, number: string, date: string, text: string): NewMessage;
        function reassembleText(evt: NewMessage): string;
    }
    interface NewActiveDongle extends Event {
        dongleevent: typeof NewActiveDongle.dongleevent;
        imei: string;
        iccid: string;
        imsi: string;
        number: string;
        serviceprovider: string;
    }
    namespace NewActiveDongle {
        const dongleevent = "NewActiveDongle";
        function match(evt: UserEvent): evt is NewActiveDongle;
        function build(imei: string, iccid: string, imsi: string, number: string, serviceprovider: string): NewActiveDongle;
    }
    interface DongleDisconnect extends Event {
        dongleevent: typeof DongleDisconnect.dongleevent;
        imei: string;
        iccid: string;
        imsi: string;
        number: string;
        serviceprovider: string;
    }
    namespace DongleDisconnect {
        const dongleevent = "DongleDisconnect";
        function match(evt: UserEvent): evt is DongleDisconnect;
        function build(imei: string, iccid: string, imsi: string, number: string, serviceprovider: string): DongleDisconnect;
    }
    interface MessageStatusReport extends Event {
        dongleevent: typeof MessageStatusReport.dongleevent;
        imei: string;
        messageid: string;
        dischargetime: string;
        isdelivered: "true" | "false";
        status: string;
        recipient: string;
    }
    namespace MessageStatusReport {
        const dongleevent = "MessageStatusReport";
        function match(evt: UserEvent): evt is MessageStatusReport;
        function build(imei: string, messageid: string, dischargetime: string, isdelivered: MessageStatusReport['isdelivered'], status: string, recipient: string): MessageStatusReport;
    }
}
export interface Request extends UserEvent {
    userevent: typeof Request.userevent;
    donglerequest: string;
}
export declare namespace Request {
    const userevent: string;
    function match(evt: UserEvent): evt is Request;
    function build(donglerequest: string): Request;
    interface UpdateNumber extends Request {
        donglerequest: typeof UpdateNumber.donglerequest;
        imei: string;
        number: string;
    }
    namespace UpdateNumber {
        const donglerequest = "UpdateNumber";
        function match(evt: UserEvent): evt is UpdateNumber;
        function build(imei: string, number: string): UpdateNumber;
    }
    interface GetSimPhonebook extends Request {
        donglerequest: typeof GetSimPhonebook.donglerequest;
        imei: string;
    }
    namespace GetSimPhonebook {
        const donglerequest = "GetSimPhonebook";
        function match(evt: UserEvent): evt is GetSimPhonebook;
        function build(imei: string): GetSimPhonebook;
    }
    interface DeleteContact extends Request {
        donglerequest: typeof DeleteContact.donglerequest;
        imei: string;
        index: string;
    }
    namespace DeleteContact {
        const donglerequest = "DeleteContact";
        function match(evt: UserEvent): evt is DeleteContact;
        function build(imei: string, index: string): DeleteContact;
    }
    interface CreateContact extends Request {
        donglerequest: typeof CreateContact.donglerequest;
        imei: string;
        name: string;
        number: string;
    }
    namespace CreateContact {
        const donglerequest = "CreateContact";
        function match(evt: UserEvent): evt is CreateContact;
        function build(imei: string, name: string, number: string): CreateContact;
    }
    interface GetMessages extends Request {
        donglerequest: typeof GetMessages.donglerequest;
        imei: string;
        flush: "true" | "false";
    }
    namespace GetMessages {
        const donglerequest = "GetMessages";
        function match(evt: UserEvent): evt is GetMessages;
        function build(imei: string, flush: "true" | "false"): GetMessages;
    }
    interface SendMessage extends Request {
        donglerequest: typeof SendMessage.donglerequest;
        imei: string;
        number: string;
        text: string;
        textsplitcount: string;
        [textn: string]: string;
    }
    namespace SendMessage {
        const donglerequest = "SendMessage";
        function match(evt: UserEvent): evt is SendMessage;
        function build(imei: string, number: string, text: string): SendMessage;
        function reassembleText(evt: SendMessage): string;
    }
    interface GetLockedDongles extends Request {
        donglerequest: typeof GetLockedDongles.donglerequest;
    }
    namespace GetLockedDongles {
        const donglerequest = "GetLockedDongles";
        function match(evt: UserEvent): evt is GetLockedDongles;
        function build(): GetLockedDongles;
    }
    interface GetActiveDongles extends Request {
        donglerequest: typeof GetActiveDongles.donglerequest;
    }
    namespace GetActiveDongles {
        const donglerequest = "GetActiveDongles";
        function match(evt: UserEvent): evt is GetActiveDongles;
        function build(): GetActiveDongles;
    }
    interface UnlockDongle extends Request {
        donglerequest: typeof UnlockDongle.donglerequest;
        imei: string;
        pin: string;
        puk: string;
        newpin: string;
    }
    namespace UnlockDongle {
        const donglerequest = "UnlockDongle";
        function match(evt: UserEvent): evt is UnlockDongle;
        function build(imei: string, pin: string): UnlockDongle;
        function build(imei: string, puk: string, newpin: string): UnlockDongle;
    }
}
export interface Response extends UserEvent {
    userevent: typeof Response.userevent;
    error?: string;
}
export declare namespace Response {
    const userevent = "DongleExt Response";
    function match(actionid: string): (evt: UserEvent) => evt is Response;
    function build(actionid: string, error?: string): Response;
    interface SendMessage extends Response {
        messageid: string;
    }
    namespace SendMessage {
        function match(actionid: string): (evt: UserEvent) => evt is SendMessage;
        function build(actionid: string, messageid: string): SendMessage;
    }
    interface CreateContact extends Response {
        index: string;
        name: string;
        number: string;
    }
    namespace CreateContact {
        function match(actionid: string): (evt: UserEvent) => evt is CreateContact;
        function build(actionid: string, index: string, name: string, number: string): CreateContact;
    }
    interface GetSimPhonebook_first extends Response {
        contactnamemaxlength: string;
        numbermaxlength: string;
        storageleft: string;
        contactcount: string;
    }
    namespace GetSimPhonebook_first {
        function match(actionid: string): (evt: UserEvent) => evt is GetSimPhonebook_first;
        function build(actionid: string, contactnamemaxlength: string, numbermaxlength: string, storageleft: string, contactcount: string): GetSimPhonebook_first;
    }
    interface GetSimPhonebook_follow extends Response {
        index: string;
        name: string;
        number: string;
    }
    namespace GetSimPhonebook_follow {
        function match(actionid: string): (evt: UserEvent) => evt is GetSimPhonebook_follow;
        function build(actionid: string, index: string, name: string, number: string): GetSimPhonebook_follow;
    }
    interface GetLockedDongles_first extends Response {
        donglecount: string;
    }
    namespace GetLockedDongles_first {
        function match(actionid: string): (evt: UserEvent) => evt is GetLockedDongles_first;
        function build(actionid: string, donglecount: string): GetLockedDongles_first;
    }
    interface GetLockedDongles_follow extends Response {
        imei: string;
        iccid: string;
        pinstate: string;
        tryleft: string;
    }
    namespace GetLockedDongles_follow {
        function match(actionid: string): (evt: UserEvent) => evt is GetLockedDongles_follow;
        function build(actionid: string, imei: string, iccid: string, pinstate: string, tryleft: string): GetLockedDongles_follow;
    }
    interface GetMessages_first extends Response {
        messagescount: string;
    }
    namespace GetMessages_first {
        function match(actionid: string): (evt: UserEvent) => evt is GetMessages_first;
        function build(actionid: string, messagescount: string): GetMessages_first;
    }
    interface GetMessages_follow extends Response {
        number: string;
        date: string;
        textsplitcount: string;
        [textn: string]: string | undefined;
    }
    namespace GetMessages_follow {
        function match(actionid: string): (evt: UserEvent) => evt is GetMessages_follow;
        function build(actionid: string, number: string, date: string, text: string): GetMessages_follow;
        function reassembleText(evt: GetMessages_follow): string;
    }
    interface GetActiveDongles_first extends Response {
        donglecount: string;
    }
    namespace GetActiveDongles_first {
        function match(actionid: string): (evt: UserEvent) => evt is GetActiveDongles_first;
        function build(actionid: string, donglecount: string): GetActiveDongles_first;
    }
    interface GetActiveDongles_follow extends Response {
        imei: string;
        iccid: string;
        imsi: string;
        number: string;
        serviceprovider: string;
    }
    namespace GetActiveDongles_follow {
        function match(actionid: string): (evt: UserEvent) => evt is GetActiveDongles_follow;
        function build(actionid: string, imei: string, iccid: string, imsi: string, number: string, serviceprovider: string): GetActiveDongles_follow;
    }
}
