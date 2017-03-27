import { UserEvent } from "../shared/AmiUserEvent";
import Response= UserEvent.Response;
import Request= UserEvent.Request;
import Event= UserEvent.Event;

import { AmiCredential, Credential } from "../shared/AmiCredential";
import * as AstMan from "asterisk-manager";
import { SyncEvent } from "ts-events-extended";

import { StatusReport, AtMessage, Message, Contact } from "../../../../ts-gsm-modem/dist/lib/index";

export const JSON_parse_WithDate= (str: string) => JSON.parse(
        str,
        (_, value) =>
            (
                typeof value === "string" &&
                value.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
            ) ? new Date(value) : value
);


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


export type Phonebook = {
    infos: {
        contactNameMaxLength: number;
        numberMaxLength: number;
        storageLeft: number;
    };
    contacts: Contact[];
};

process.on("unhandledRejection", error => {
    console.log("INTERNAL ERROR AMI CLIENT".red);
    console.log(error);
    throw error;
});


export class AmiClient {

    private static localClient: AmiClient | undefined = undefined;

    public static localhost(): AmiClient {

        if (this.localClient) return this.localClient;

        return this.localClient = new this(AmiCredential.retrieve());

    };

    private readonly ami: any;

    public readonly evtMessageStatusReport = new SyncEvent<{ imei: string } & StatusReport>();
    public readonly evtDongleDisconnect = new SyncEvent<DongleActive>();
    public readonly evtNewActiveDongle = new SyncEvent<DongleActive>();
    public readonly evtRequestUnlockCode = new SyncEvent<LockedDongle>();
    public readonly evtNewMessage = new SyncEvent<{ imei: string } & Message>();

    public readonly evtAmiUserEvent= new SyncEvent<UserEvent>();

    constructor(credential: Credential) {

        let { port, host, user, secret } = credential;

        this.ami = new AstMan(port, host, user, secret, true);

        this.ami.on("userevent", evt => this.evtAmiUserEvent.post(evt));

        this.registerListeners();

    }

    private registerListeners(): void {

        this.evtAmiUserEvent.attach(Event.matchEvt, evt => {

            if (Event.MessageStatusReport.matchEvt(evt))
                this.evtMessageStatusReport.post({
                    "imei": evt.imei,
                    "messageId": parseInt(evt.messageid),
                    "isDelivered": evt.isdelivered === "true",
                    "status": evt.status,
                    "dischargeTime": new Date(evt.dischargetime)
                });
            else if (Event.DongleDisconnect.matchEvt(evt))
                this.evtDongleDisconnect.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "imsi": evt.imsi,
                    "number": evt.number || undefined
                });
            else if (Event.NewActiveDongle.matchEvt(evt))
                this.evtNewActiveDongle.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "imsi": evt.imsi,
                    "number": evt.number || undefined
                });
            else if (Event.RequestUnlockCode.matchEvt(evt))
                this.evtRequestUnlockCode.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "pinState": evt.pinstate,
                    "tryLeft": parseInt(evt.tryleft)
                });
            else if (Event.NewMessage.matchEvt(evt))
                this.evtNewMessage.post({
                    "imei": evt.imei,
                    "number": evt.number,
                    "date": new Date(evt.date),
                    "text": UserEvent.Event.NewMessage.reassembleText(evt)
                });

        });

    }

    public postUserEventAction(actionEvt: UserEvent): { actionid: string; promise: Promise<void> } {
        //return this.ami.action(actionEvt);

        let actionid: string= "";

        let promise = new Promise<void>((resolve, reject) => {

            actionid= this.ami.actionExpectSingleResponse(actionEvt, (error,res) => {

                if (error) reject(error);

                resolve();

            });

        });

        return { actionid, promise };

    }

    public disconnect(): void {
        this.ami.disconnect();
    }


    public async getLockedDongles(
        callback?: (dongles: LockedDongle[]) => void
    ): Promise<LockedDongle[]> {

        let { actionid } = this.postUserEventAction(
            Request.GetLockedDongles.buildAction()
        );

        let evtResponse = await this.evtAmiUserEvent.waitFor(
            Response.GetLockedDongles.Infos.matchEvt(actionid),
            10000
        );

        let dongleCount= parseInt(evtResponse.donglecount);

        let out: LockedDongle[]= [];

        while( out.length !== dongleCount ){

            let evtResponse= await this.evtAmiUserEvent.waitFor(
                Response.GetLockedDongles.Entry.matchEvt(actionid),
                10000
            );

            let { imei, iccid, pinstate, tryleft } = evtResponse;

            out.push({
                imei,
                iccid,
                "pinState": pinstate as AtMessage.LockedPinState,
                "tryLeft": parseInt(tryleft)
            });

        }

        if (callback) callback(out);
        return out;

    }

    public async getActiveDongles(
        callback?: (dongles: DongleActive[]) => void
    ): Promise<DongleActive[]> {

        let { actionid } = this.postUserEventAction(
            Request.GetActiveDongles.buildAction()
        );

        let evtResponse = await this.evtAmiUserEvent.waitFor(
            Response.GetActiveDongles.Infos.matchEvt(actionid),
            10000
        );

        let dongleCount = parseInt(evtResponse.donglecount);

        let out: DongleActive[] = [];

        while (out.length !== dongleCount) {

            let evtResponse = await this.evtAmiUserEvent.waitFor(
                Response.GetActiveDongles.Entry.matchEvt(actionid),
                10000
            );

            let { imei, iccid, imsi, number } = evtResponse;

            out.push({ imei, iccid, imsi, "number": number || undefined });

        }

        if (callback) callback(out);
        return out;

    }

    public async sendMessage(
        imei: string,
        number: string,
        text: string,
        callback?: (error: Error | null, messageId: number) => void
    ): Promise<[Error | null, number]> {

        let { actionid } = this.postUserEventAction(
            Request.SendMessage.buildAction(
                imei, number, text
            )
        );

        let evtResponse = await this.evtAmiUserEvent.waitFor(
            Response.SendMessage.matchEvt(actionid),
            10000
        );

        let error: null | Error;
        let messageId: number;

        if (evtResponse.error) {

            error = new Error(evtResponse.error);

            messageId = NaN;

        } else {

            error = null;

            messageId = parseInt(evtResponse.messageid);

        }

        if (callback) callback(error, messageId);
        return [error, messageId];

    }


    public async  getSimPhonebook(
        imei: string,
        callback?: (error: null | Error, phonebook: Phonebook | null) => void
    ): Promise<[null | Error, Phonebook | null]> {

        let { actionid } = this.postUserEventAction(
            Request.GetSimPhonebook.buildAction(imei)
        );

        let evt = await this.evtAmiUserEvent.waitFor(
            Response.GetSimPhonebook.Infos.matchEvt(actionid),
            10000
        );

        if (evt.error) {
            let error = new Error(evt.error);
            if (callback) callback(error, null);
            return [error, null];
        }

        let infos = {
            "contactNameMaxLength": parseInt(evt.contactnamemaxlength),
            "numberMaxLength": parseInt(evt.numbermaxlength),
            "storageLeft": parseInt(evt.storageleft)
        };

        let contactCount = parseInt(evt.contactcount);

        let contacts: Contact[] = [];

        while (contacts.length !== contactCount) {

            let evt = await this.evtAmiUserEvent.waitFor(
                Response.GetSimPhonebook.Entry.matchEvt(actionid),
                10000
            );

            contacts.push({
                "index": parseInt(evt.index),
                "name": evt.name,
                "number": evt.number
            });

        }

        let phonebook = { infos, contacts };

        if (callback) callback(null, phonebook);

        return [null, phonebook];

    }

    public async createContact(
        imei: string,
        name: string,
        number: string,
        callback?: (error: null | Error, contact: Contact | null) => void
    ): Promise<[null | Error, Contact | null]> {

        let { actionid } = this.postUserEventAction(
            Request.CreateContact.buildAction(
                imei,
                name,
                number
            )
        );

        let evt = await this.evtAmiUserEvent.waitFor(
            Response.CreateContact.matchEvt(actionid),
            10000
        );

        if (evt.error) {

            let error = new Error(evt.error);

            if (callback) callback(error, null);

            return [error, null];

        }

        let contact: Contact = {
            "index": parseInt(evt.index),
            "name": evt.name,
            "number": evt.number
        };

        if (callback) callback(null, contact);
        return [null, contact];

    }

    public getMessages(
        imei: string,
        flush: boolean,
        callback?: (error: null | Error, messages: Message[] | null) => void
    ): Promise<[null | Error, Message[] | null]> {

        /*

        return new Promise<[null | Error, Message[] | null]>(resolve => {

            let ami = this.ami;

            let actionId = ami.action(
                UserEvent.Request.GetMessages.buildAction(
                    imei,
                    flush ? "true" : "false"
                )
            );

            ami.on("userevent", function callee(evt: UserEvent) {

                if (!UserEvent.Response.GetMessages.matchEvt(evt, actionId))
                    return;

                ami.removeListener("userevent", callee);


                let error: null | Error;
                let messages: Message[] | null;

                if (evt.error) {
                    error = new Error(evt.error);
                    messages = null;
                } else {
                    error = null;
                    messages = UserEvent.Response.GetMessages
                        .reassembleMessage(evt)
                        .map(value => JSON_parse_WithDate(value))
                        .sort(
                        (message1: Message, message2: Message) => message1.date.getTime() - message2.date.getTime()
                        );
                }


                if (callback) callback(error, messages);
                resolve([error, messages]);

            });

        });
        */

        return null as any;

    }

    public async deleteContact(
        imei: string,
        index: number,
        callback?: (error: null | Error) => void
    ): Promise<null | Error> {

        let { actionid } = this.postUserEventAction(
            Request.DeleteContact.buildAction(
                imei,
                index.toString()
            )
        );

        let evt = await this.evtAmiUserEvent.waitFor(
            Response.matchEvt(Request.DeleteContact.keyword, actionid),
            10000
        );

        let error = evt.error ? new Error(evt.error) : null;

        if (callback) callback(error);
        return error;

    }


    private static readUnlockParams(inputs: any[]): {
        imei: string;
        pin?: string;
        puk?: string;
        newPin?: string;
        callback?: (error: null | Error) => void
    } {

        let imei = inputs.shift();

        let callback: ((error: null | Error) => void) | undefined = undefined;

        if (typeof inputs[inputs.length - 1] === "function")
            callback = inputs.pop();


        if (inputs.length === 1) {

            let [pin] = inputs;

            return { imei, pin, callback };

        } else {

            let [puk, newPin] = inputs;

            return { imei, puk, newPin, callback };

        }


    }

    public unlockDongle(imei: string, pin: string, callback?: (error: null | Error) => void): Promise<null | Error>;
    public unlockDongle(imei: string, puk: string, newPin: string, callback?: (error: null | Error) => void): Promise<null | Error>;
    public async unlockDongle(...inputs: any[]): Promise<null | Error> {

        let { imei, pin, puk, newPin, callback } = AmiClient.readUnlockParams(inputs);

        let actionid: string;

        if (pin)
            actionid = this.postUserEventAction(
                Request.UnlockDongle.buildAction(imei, pin)
            ).actionid;
        else
            actionid = this.postUserEventAction(
                Request.UnlockDongle.buildAction(imei, puk!, newPin!)
            ).actionid;

        let evt = await this.evtAmiUserEvent.waitFor(
            Response.matchEvt(Request.UnlockDongle.keyword, actionid),
            10000
        );

        let error = evt.error ? new Error(evt.error) : null;

        if (callback) callback(error);
        return error;

    }

}