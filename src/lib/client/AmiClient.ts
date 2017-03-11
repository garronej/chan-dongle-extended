import { UserEvent } from "../shared/AmiUserEvent";
import { AmiCredential, Credential } from "../shared/AmiCredential";
import * as AstMan from "asterisk-manager";
import { SyncEvent } from "ts-events-extended";

import { StatusReport, Message, LockedPinState, Contact } from "../../../../ts-gsm-modem/out/lib/index";

export type LockedDongles= {
        [imei: string]: {
            pinState: LockedPinState,
            tryLeft: number
        };
}

export class AmiClient {


    private static localClient: AmiClient | undefined = undefined;

    public static getLocal(): AmiClient {

        if (this.localClient) return this.localClient;

        return this.localClient = new this(AmiCredential.retrieve());

    };

    private readonly ami: any;

    public readonly evtMessageStatusReport = new SyncEvent<{ imei: string } & StatusReport>();
    public readonly evtDongleDisconnect = new SyncEvent<{ imei: string }>();
    public readonly evtNewActiveDongle = new SyncEvent<{ imei: string }>();
    public readonly evtRequestUnlockCode = new SyncEvent<{
        imei: string;
        pinState: LockedPinState;
        tryLeft: number;
    }>();
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
                    "dischargeTime": new Date(parseInt(evt.dischargetime))
                });
            else if (UserEvent.Event.DongleDisconnect.matchEvt(evt))
                this.evtDongleDisconnect.post({
                    "imei": evt.imei
                });
            else if (UserEvent.Event.NewActiveDongle.matchEvt(evt))
                this.evtNewActiveDongle.post({
                    "imei": evt.imei
                });
            else if (UserEvent.Event.RequestUnlockCode.matchEvt(evt))
                this.evtRequestUnlockCode.post({
                    "imei": evt.imei,
                    "pinState": evt.pinstate,
                    "tryLeft": parseInt(evt.tryleft)
                });
            else if (UserEvent.Event.NewMessage.matchEvt(evt))
                this.evtNewMessage.post({
                    "imei": evt.imei,
                    "number": evt.number,
                    "date": new Date(parseInt(evt.date)),
                    "text": JSON.parse(evt.text) as string
                });


        });

    }

    public disconnect(): void {
        this.ami.disconnect();
    }

    public getLockedDongles(
        callback?: (dongles: LockedDongles) => void
    ): Promise<LockedDongles> {

        let promise = new Promise<LockedDongles>(resolve => {

            let ami = this.ami;

            let actionid = ami.action(
                UserEvent.Request.GetLockedDongles.buildAction()
            );

            ami.on("userevent", function callee(evt: UserEvent) {

                if (!UserEvent.Response.GetLockedDongles.matchEvt(evt, actionid))
                    return;

                ami.removeListener("userevent", callee);

                resolve(JSON.parse(evt.dongles));

            });

        });

        if( !callback )
            return promise;
        else{
            promise.then( dongles => callback(dongles));
            return null as any;
        }

    }

    public sendMessage(
        imei: string,
        number: string,
        text: string,
        callback?: (error: Error | null, messageId: number) => void
    ): Promise<[Error | null, number]> {

        let promise = new Promise<[Error | null, number]>(resolve => {

            let ami = this.ami;

            let actionid = ami.action(
                UserEvent.Request.SendMessage.buildAction(
                    imei, number, JSON.stringify(text)
                )
            );

            ami.on("userevent", function callee(evt: UserEvent) {

                if (!UserEvent.Response.SendMessage.matchEvt(evt, actionid))
                    return;

                ami.removeListener("userevent", callee);

                if (evt.error)
                    resolve([new Error(evt.error), NaN]);
                else
                    resolve([null, parseInt(evt.messageid)]);

            });


        });

        if (!callback)
            return promise;
        else {
            promise.then(([error, messageId]) => callback(error, messageId));
            return null as any;
        }


    }

    public getSimPhonebook(
        imei: string,
        callback?: (error: null | Error, phonebook: Contact[]) => void
    ): Promise<[Error | null, Contact[]]> {

        let promise = new Promise<[Error | null, Contact[]]>(resolve => {

            let ami = this.ami;

            let actionid = ami.action(
                UserEvent.Request.GetSimPhonebook.buildAction(imei)
            );

            ami.on("userevent", function callee(evt: UserEvent) {

                if (!UserEvent.Response.GetSimPhonebook.matchEvt(evt, actionid))
                    return;

                ami.removeListener("userevent", callee);

                if (evt.error)
                    resolve([new Error(evt.error), []]);
                else
                    resolve([null, JSON.parse(
                        evt.phonebookpart1 + evt.phonebookpart2 + evt.phonebookpart3
                    )]);


            });

        });

        if( !callback )
            return promise;
        else{
            promise.then( ([error, phonebook])=> callback(error, phonebook) );
            return null as any;
        }

    }

    public createContact(
        imei: string,
        name: string,
        number: string,
        callback?: (error: null | Error, contact: Contact | null) => void
    ): Promise<[null | Error, Contact | null]> {

        let promise = new Promise<[null | Error, Contact | null]>(resolve => {

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


                if (evt.error)
                    resolve([new Error(evt.error), null]);
                else
                    resolve([null, {
                        "index": parseInt(evt.index),
                        "name": evt.name,
                        "number": evt.number
                    }]);

            });


        });

        if( !callback )
            return promise;
        else{
            promise.then( ([error, contact])=> callback(error, contact));
            return null as any;
        }



    }

    public deleteContact(
        imei: string,
        index: number,
        callback?: (error: null | Error) => void
    ): Promise<null | Error> {

        let promise = new Promise<null | Error>(resolve => {

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

                if (evt.error)
                    resolve(new Error(evt.error));
                else
                    resolve(null);

            });

        });

        if (!callback)
            return promise;
        else {
            promise.then(error => callback(error));
            return null as any;
        }


    }


    public getActiveDongles(
        callback?: (dongles: string[]) => void
    ): Promise<string[]> {

        let promise = new Promise<string[]>(resolve => {

            let ami = this.ami;

            let actionid = ami.action(
                UserEvent.Request.GetActiveDongles.buildAction()
            );

            ami.on("userevent", function callee(evt: UserEvent) {

                if (!UserEvent.Response.GetActiveDongles.matchEvt(evt, actionid))
                    return;

                ami.removeListener("userevent", callee);

                resolve(JSON.parse(evt.dongles));

            });

        });

        if( !callback )
            return promise;
        else{
            promise.then( dongles => callback(dongles));
            return null as any;
        }


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

        let promise = new Promise<null | Error>(resolve => {

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

                if (!UserEvent.Response.GetLockedDongles.matchEvt(evt, actionid))
                    return;

                ami.removeListener("userevent", callee);

                resolve(evt.error ? new Error(evt.error) : null);


            });


        });

        if ( typeof callback === "function" ){
            promise.then( error => callback(error));
        }else 
            return promise;




    }


}