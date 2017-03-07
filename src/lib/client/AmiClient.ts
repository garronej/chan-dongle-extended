import { UserEvent } from "../shared/AmiUserEvent";
import { AmiCredential, Credential } from "../shared/AmiCredential";
import * as AstMan from "asterisk-manager";
import { SyncEvent } from "ts-events-extended";

import { StatusReport, LockedPinState } from "../../../../ts-gsm-modem/out/lib/index";


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

        });

    }

    public disconnect(): void {
        this.ami.disconnect();
    }


    //TODO: test if | break
    public sendMessage(
        imei: string,
        number: string,
        text: string,
        callback?: (error: Error | null, messageId: number) => void
    ): void {

        let ami = this.ami;

        let actionid = ami.action(
            UserEvent.Request.SendMessage.buildAction(
                imei, number, JSON.stringify(text)
            )
        );

        if (!callback) return;


        ami.on("userevent", function callee(evt: UserEvent) {

            if (!UserEvent.Response.SendMessage.matchEvt(evt, actionid))
                return;

            ami.removeListener("userevent", callee);

            callback(evt.error ? new Error(evt.error) : null, parseInt(evt.messageid));

        });

    }

    public getLockedDongles(callback: (dongles: {
        [imei: string]: {
            pinState: LockedPinState,
            tryLeft: number
        }
    }) => void
    ): void {

        let ami = this.ami;

        let actionid = ami.action(
            UserEvent.Request.GetLockedDongles.buildAction()
        );

        ami.on("userevent", function callee(evt: UserEvent) {

            if (!UserEvent.Response.GetLockedDongles.matchEvt(evt, actionid))
                return;

            ami.removeListener("userevent", callee);

            callback(JSON.parse(evt.dongles));

        });


    }


    public getActiveDongles(callback: (dongles: string[]) => void
    ): void {

        let ami = this.ami;

        let actionid = ami.action(
            UserEvent.Request.GetActiveDongles.buildAction()
        );

        ami.on("userevent", function callee(evt: UserEvent) {

            if (!UserEvent.Response.GetActiveDongles.matchEvt(evt, actionid))
                return;

            ami.removeListener("userevent", callee);

            callback(JSON.parse(evt.dongles));

        });


    }

    public unlockDongle(imei: string, pin: string, callback?: (error: null | Error) => void): void;
    public unlockDongle(imei: string, puk: string, newPin: string, callback?: (error: null | Error) => void): void;
    public unlockDongle(...inputs: any[]): void {

        let ami = this.ami;

        let imei = inputs[0];
        let callback: ((error: null | Error) => void) | undefined = undefined;

        let lastInput = inputs.pop();

        if (typeof lastInput === "function")
            callback = lastInput;
        else
            inputs.push(lastInput);

        let actionid: string;

        if (inputs.length === 2)
            actionid = ami.action(
                UserEvent.Request.UnlockDongle.buildAction(imei, inputs[1])
            );
        else
            actionid = ami.action(
                UserEvent.Request.UnlockDongle.buildAction(imei, inputs[1], inputs[2])
            );

        if (!callback) return;

        ami.on("userevent", function callee(evt: UserEvent) {

            if (!UserEvent.Response.GetLockedDongles.matchEvt(evt, actionid))
                return;


            ami.removeListener("userevent", callee);

            callback!(evt.error ? new Error(evt.error) : null);


        });


    }

}