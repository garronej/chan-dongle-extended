import { UserEvent } from "../shared/AmiUserEvent";
import { Credential } from "../shared/AmiCredential";
import { SyncEvent } from "ts-events-extended";
import { StatusReport, AtMessage, Message, Contact } from "../../../../ts-gsm-modem/dist/lib/index";
export interface DongleBase {
    imei: string;
    iccid: string;
}
export interface LockedDongle extends DongleBase {
    pinState: AtMessage.LockedPinState;
    tryLeft: number;
}
export interface DongleActive extends DongleBase {
    imsi: string;
    number: string | undefined;
}
export declare type Phonebook = {
    infos: {
        contactNameMaxLength: number;
        numberMaxLength: number;
        storageLeft: number;
    };
    contacts: Contact[];
};
export declare class AmiClient {
    private static localClient;
    static localhost(): AmiClient;
    private readonly ami;
    readonly evtMessageStatusReport: SyncEvent<{
        imei: string;
    } & StatusReport>;
    readonly evtDongleDisconnect: SyncEvent<DongleActive>;
    readonly evtNewActiveDongle: SyncEvent<DongleActive>;
    readonly evtRequestUnlockCode: SyncEvent<LockedDongle>;
    readonly evtNewMessage: SyncEvent<{
        imei: string;
    } & Message>;
    readonly evtAmiUserEvent: SyncEvent<UserEvent>;
    constructor(credential: Credential);
    private registerListeners();
    postUserEventAction(actionEvt: UserEvent): {
        actionid: string;
        promise: Promise<void>;
    };
    disconnect(): void;
    getLockedDongles(callback?: (dongles: LockedDongle[]) => void): Promise<LockedDongle[]>;
    getActiveDongles(callback?: (dongles: DongleActive[]) => void): Promise<DongleActive[]>;
    sendMessage(imei: string, number: string, text: string, callback?: (error: Error | null, messageId: number) => void): Promise<[Error | null, number]>;
    getSimPhonebook(imei: string, callback?: (error: null | Error, phonebook: Phonebook | null) => void): Promise<[null | Error, Phonebook | null]>;
    createContact(imei: string, name: string, number: string, callback?: (error: null | Error, contact: Contact | null) => void): Promise<[null | Error, Contact | null]>;
    getMessages(imei: string, flush: boolean, callback?: (error: null | Error, messages: Message[] | null) => void): Promise<[null | Error, Message[] | null]>;
    deleteContact(imei: string, index: number, callback?: (error: null | Error) => void): Promise<null | Error>;
    private static readUnlockParams(inputs);
    unlockDongle(imei: string, pin: string, callback?: (error: null | Error) => void): Promise<null | Error>;
    unlockDongle(imei: string, puk: string, newPin: string, callback?: (error: null | Error) => void): Promise<null | Error>;
}
