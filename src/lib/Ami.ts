export interface Ami {
    event?: string;
    action?: string;
    actionid?: string;
    [key: string]: string | undefined;
}

export namespace Ami {

    export function build(action: string): Ami {
        return { action };
    }

    export interface UserEvent extends Ami {
        event?: "UserEvent";
        action?: "UserEvent";
        userevent: string;
    }

    export namespace UserEvent {

        export function matchEvt(evt: Ami): evt is UserEvent {
            return (
                evt.event === "UserEvent" &&
                evt.hasOwnProperty("userevent")
            );
        }

        export function buildAction(userevent: string): UserEvent {
            return {
                ...Ami.build("UserEvent"),
                userevent
            } as UserEvent;
        }


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

            export interface SendMessage extends Request {
                command: "SendMessage";
                imei: string;
                number: string;
                text: string;
            }

            export namespace SendMessage {

                export function matchEvt(evt: Request): evt is SendMessage {
                    return (
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

        }

        export interface Response extends UserEvent {
            userevent: "DongleExt Response";
            responseto: string;
            error?: string
        }

        export namespace Response {

            export function buildAction(responseto: string, actionid: string, error?: string): Response {
                let out = {
                    ...UserEvent.buildAction("DongleExt Response"),
                    responseto,
                    actionid
                } as Response;

                if (typeof error === "string") out.error = error;

                return out;
            }

            export interface SendMessage extends Response {
                responseto: "SendMessage";
                messageid: string;
            }

            export namespace SendMessage {

                export function matchEvt(evt: Ami, actionid: string): evt is SendMessage {
                    return (
                        evt.actionid === actionid &&
                        evt.responseto === "SendMessage"
                    );
                }

                export function buildAction(actionid: string, messageid: string, error?: string): SendMessage {
                    return {
                        ...Response.buildAction("SendMessage",actionid, error),
                        messageid
                    } as SendMessage;

                }
            }
        }
    }
}