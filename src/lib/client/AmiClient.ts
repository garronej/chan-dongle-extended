import { UserEvent } from "../shared/AmiUserEvent";
import { AmiCredential, Credential } from "../shared/AmiCredential";
import * as AstMan from "asterisk-manager";
import { SyncEvent } from "ts-events-extended";

import { StatusReport, AtMessage, Message, Contact } from "../../../../ts-gsm-modem/out/lib/index";


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

export class AmiClient {

    private static localClient: AmiClient | undefined = undefined;

    public static localhost(): AmiClient {

        if (this.localClient) return this.localClient;

        return this.localClient = new this(AmiCredential.retrieve());

    };

    private readonly ami: any;

    public readonly evtMessageStatusReport = new SyncEvent<{ imei: string } & StatusReport>();
    public readonly evtDongleDisconnect = new SyncEvent<{ imei: string}>();
    public readonly evtNewActiveDongle = new SyncEvent<DongleActive>();
    public readonly evtRequestUnlockCode = new SyncEvent<LockedDongle>();
    public readonly evtNewMessage = new SyncEvent<{ imei: string } & Message>();

    constructor(credential: Credential) {

        let { port, host, user, secret } = credential;

        this.ami = new AstMan(port, host, user, secret, true);

        this.ami.on("userevent", (evt: UserEvent) => {

            if (!UserEvent.Event.matchEvt(evt)) return;

            if (UserEvent.Event.MessageStatusReport.matchEvt(evt))
                this.evtMessageStatusReport.post({
                    "imei": evt.imei,
                    "messageId": parseInt(evt.messageid),
                    "isDelivered": evt.isdelivered === "true",
                    "status": evt.status,
                    "dischargeTime": new Date(evt.dischargetime)
                });
            else if (UserEvent.Event.DongleDisconnect.matchEvt(evt))
                this.evtDongleDisconnect.post({
                    "imei": evt.imei
                });
            else if (UserEvent.Event.NewActiveDongle.matchEvt(evt))
                this.evtNewActiveDongle.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "imsi": evt.imsi,
                    "number": evt.number || undefined
                });
            else if (UserEvent.Event.RequestUnlockCode.matchEvt(evt))
                this.evtRequestUnlockCode.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "pinState": evt.pinstate,
                    "tryLeft": parseInt(evt.tryleft)
                });
            else if (UserEvent.Event.NewMessage.matchEvt(evt))
                this.evtNewMessage.post({
                    "imei": evt.imei,
                    "number": evt.number,
                    "date": new Date(evt.date),
                    "text": UserEvent.Event.NewMessage.reassembleText(evt)
                });


        });

    }

    public disconnect(): void {
        this.ami.disconnect();
    }

    public getLockedDongles(
        callback?: (dongles: LockedDongle[]) => void
    ): Promise<LockedDongle[]> {

        return new Promise<LockedDongle[]>(resolve => {

            let ami = this.ami;

            let actionid = ami.action(
                UserEvent.Request.GetLockedDongles.buildAction()
            );

            ami.on("userevent", function callee(evt: UserEvent) {

                if (!UserEvent.Response.GetLockedDongles.matchEvt(evt, actionid))
                    return;

                ami.removeListener("userevent", callee);

                let lockedDongles: LockedDongle[]= JSON.parse(evt.dongles);

                if( callback ) callback(lockedDongles);
                resolve(lockedDongles);

            });

        });


    }

    public sendMessage(
        imei: string,
        number: string,
        text: string,
        callback?: (error: Error | null, messageId: number) => void
    ): Promise<[Error | null, number]> {

        return new Promise<[Error | null, number]>(resolve => {

            let ami = this.ami;

            let actionid = ami.action(
                UserEvent.Request.SendMessage.buildAction(
                    imei, number, text
                )
            );

            ami.on("userevent", function callee(evt: UserEvent) {

                if (!UserEvent.Response.SendMessage.matchEvt(evt, actionid))
                    return;

                ami.removeListener("userevent", callee);

                let error: null | Error;
                let messageId: number;

                if( evt.error ){

                    error= new Error(evt.error);

                    messageId= NaN;

                }else{

                    error= null;

                    messageId= parseInt(evt.messageid);

                }

                if( callback ) callback(error, messageId);
                resolve([error, messageId]);


            });


        });



    }

    public getSimPhonebook(
        imei: string,
        callback?: (error: null | Error, phonebook: Contact[]) => void
    ): Promise<[Error | null, Contact[]]> {

        return new Promise<[Error | null, Contact[]]>(resolve => {

            let ami = this.ami;

            let actionid = ami.action(
                UserEvent.Request.GetSimPhonebook.buildAction(imei)
            );

            ami.on("userevent", function callee(evt: UserEvent) {

                if (!UserEvent.Response.GetSimPhonebook.matchEvt(evt, actionid))
                    return;

                ami.removeListener("userevent", callee);

                let error: null | Error;
                let contacts: Contact[];

                if (evt.error) {

                    error = new Error(evt.error);

                    contacts = [];

                } else {

                    error = null;

                    contacts = JSON.parse(
                        evt.phonebookpart1 + evt.phonebookpart2 + evt.phonebookpart3
                    );

                }

                if (callback) callback(null, contacts);
                resolve([null, contacts]);

            });

        });


    }

    public createContact(
        imei: string,
        name: string,
        number: string,
        callback?: (error: null | Error, contact: Contact | null) => void
    ): Promise<[null | Error, Contact | null]> {

        return new Promise<[null | Error, Contact | null]>(resolve => {

            let ami = this.ami;

            let actionid = ami.action(
                UserEvent.Request.CreateContact.buildAction(
                    imei,
                    name,
                    number
                )
            );

            ami.on("userevent", function callee(evt: UserEvent) {

                if (!UserEvent.Response.CreateContact.matchEvt(evt, actionid))
                    return;

                ami.removeListener("userevent", callee);


                if (evt.error) {

                    let error = new Error(evt.error);

                    if (callback) callback(error, null);

                    resolve([error, null]);

                    return;
                }

                let { index, name, number } = evt;

                let contact: Contact = { "index": parseInt(evt.index), name, number }

                if (callback) callback(null, contact);
                resolve([null, contact]);

            });


        });


    }

    public deleteContact(
        imei: string,
        index: number,
        callback?: (error: null | Error) => void
    ): Promise<null | Error> {

        return new Promise<null | Error>(resolve => {

            let ami = this.ami;

            let actionid = ami.action(
                UserEvent.Request.DeleteContact.buildAction(
                    imei,
                    index.toString()
                )
            );

            ami.on("userevent", function callee(evt: UserEvent) {

                if (!UserEvent.Response.DeleteContact.matchEvt(evt, actionid))
                    return;

                ami.removeListener("userevent", callee);

                let error = evt.error ? new Error(evt.error) : null;

                if (callback) callback(error);
                resolve(error);

            });

        });



    }


    public getActiveDongles(
        callback?: (dongles: DongleActive[]) => void
    ): Promise<DongleActive[]> {

        return new Promise<DongleActive[]>(resolve => {

            let ami = this.ami;

            let actionid = ami.action(
                UserEvent.Request.GetActiveDongles.buildAction()
            );

            ami.on("userevent", function callee(evt: UserEvent) {

                if (!UserEvent.Response.GetActiveDongles.matchEvt(evt, actionid))
                    return;

                ami.removeListener("userevent", callee);

                let out: DongleActive[] = [];

                for (let dongleStr of UserEvent.Response.GetActiveDongles.reassembleDongles(evt))
                    out.push(JSON.parse(dongleStr));

                if (callback) callback(out);
                resolve(out);

            });

        });

    }

    public unlockDongle(imei: string, pin: string, callback?: (error: null | Error) => void): Promise<null | Error>;
    public unlockDongle(imei: string, puk: string, newPin: string, callback?: (error: null | Error) => void): Promise<null | Error>;
    public unlockDongle(...inputs: any[]): any {

        let imei = inputs[0];
        let callback: ((error: null | Error) => void) | undefined = undefined;

        let lastInput = inputs.pop();

        if (typeof lastInput === "function")
            callback = lastInput;
        else
            inputs.push(lastInput);

        return new Promise<null | Error>(resolve => {

            let ami = this.ami;

            let actionid: string;

            if (inputs.length === 2)
                actionid = ami.action(
                    UserEvent.Request.UnlockDongle.buildAction(imei, inputs[1])
                );
            else
                actionid = ami.action(
                    UserEvent.Request.UnlockDongle.buildAction(imei, inputs[1], inputs[2])
                );


            ami.on("userevent", function callee(evt: UserEvent) {

                if (!UserEvent.Response.matchEvt(evt, actionid))
                    return;

                ami.removeListener("userevent", callee);

                let error = evt.error ? new Error(evt.error) : null;

                if (callback) callback(error);
                resolve(error);


            });


        });

    }

}