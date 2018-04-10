import { Modem } from "ts-gsm-modem";
import * as types from "./types";
import * as localsManager from "./localsManager";

import { 
    apiDeclaration, types as dcTypes, misc
} from "../chan-dongle-extended-client";
import localApiDeclaration= apiDeclaration.service;
import remoteApiDeclaration= apiDeclaration.controller;

import { isVoid, Void } from "trackable-map";

import * as storage from "./appStorage";

import * as sipLibrary from "ts-sip";
import { VoidSyncEvent } from "ts-events-extended";
import { log } from "./logger";

import * as net from "net";

const sockets = new Set<sipLibrary.Socket>();

export function launch(
    modems: types.Modems, 
    staticModuleConfiguration: dcTypes.StaticModuleConfiguration
): Promise<void> {

    let { locals }= localsManager.get();

    let server = new sipLibrary.api.Server(
        makeApiHandlers(modems),
        sipLibrary.api.Server.getDefaultLogger({
            log,
            "displayOnlyErrors": false,
            "hideKeepAlive": true
        })
    );

    let evtListening= new VoidSyncEvent();

    net.createServer()
        .once("error", error => { throw error; })
        .on("connection", async netSocket => {

            let socket = new sipLibrary.Socket(netSocket);

            server.startListening(socket);

            sockets.add(socket);

            socket.evtClose.attachOnce(() => sockets.delete(socket));

            (() => {

                const methodName = remoteApiDeclaration.notifyCurrentState.methodName;
                type Params = remoteApiDeclaration.notifyCurrentState.Params;
                type Response = remoteApiDeclaration.notifyCurrentState.Response;

                sipLibrary.api.client.sendRequest<Params, Response>(
                    socket,
                    methodName,
                    {
                        "dongles": Array.from(modems.values()).map(modem => buildDongle(modem)!),
                        staticModuleConfiguration
                    }
                ).catch(() => { });

            })();


        })
        .once("listening", ()=> evtListening.post())
        .listen(locals.port, locals.bind_addr)
        ;

    modems.evt.attach(
        ([newModem, _, oldModem]) => {

            let dongleImei: string = (() => {

                if (isVoid(newModem)) {
                    if (isVoid(oldModem)) throw "( never )";
                    return oldModem.imei;
                } else {
                    if (!isVoid(oldModem)) throw "( never )";
                    return newModem.imei;
                }

            })();

            (() => {

                const methodName = remoteApiDeclaration.updateMap.methodName;
                type Params = remoteApiDeclaration.updateMap.Params;
                type Response = remoteApiDeclaration.updateMap.Response;

                broadcastRequest<Params, Response>(
                    methodName,
                    {
                        dongleImei,
                        "dongle": buildDongle(newModem)
                    }
                );

            })();

            if (types.matchModem(newModem)) {

                onNewModem(newModem);

            }

        }
    );

    return new Promise<void>(
        resolve=> evtListening.attachOnce(()=> resolve())
    );

}

function broadcastRequest<Params, Response extends undefined>(
    methodName: string,
    params: Params
): void {

    for( let socket of sockets ){

        sipLibrary.api.client.sendRequest<Params, Response>(
            socket,
            methodName,
            params
        ).catch(()=> {});

    }

}

function onNewModem(modem: Modem) {

    let imsi = modem.imsi;

    (async () => {

        let appData = await storage.read();

        if (!appData.messages[imsi]) {
            appData.messages[imsi] = [];
        }

    })();

    let dongleImei = modem.imei;

    modem.evtMessage.attach(async message => {

        const methodName = remoteApiDeclaration.notifyMessage.methodName;
        type Params = remoteApiDeclaration.notifyMessage.Params;
        type Response = remoteApiDeclaration.notifyMessage.Response;

        let response = await new Promise<Response>(resolve => {

            let tasks: Promise<void>[] = [];

            for (let socket of sockets) {

                tasks[tasks.length] = (async () => {

                    let response: Response = "DO NOT SAVE MESSAGE";

                    try {

                        response = await sipLibrary.api.client.sendRequest<Params, Response>(
                            socket,
                            methodName,
                            { dongleImei, message }
                        );

                    } catch{ }

                    if (response === "SAVE MESSAGE") {
                        resolve(response);
                    }

                })();

            }

            Promise.all(tasks).then(() => resolve("DO NOT SAVE MESSAGE"));

        });

        if (response === "SAVE MESSAGE") {

            let appData = await storage.read();

            appData.messages[imsi].push(message);

        }

    });

    modem.evtMessageStatusReport.attach(
        statusReport => {

            const methodName = remoteApiDeclaration.notifyStatusReport.methodName;
            type Params = remoteApiDeclaration.notifyStatusReport.Params;
            type Response = remoteApiDeclaration.notifyStatusReport.Response;

            broadcastRequest<Params, Response>(methodName, { dongleImei, statusReport });

        }
    );

}

function makeApiHandlers(modems: types.Modems): sipLibrary.api.Server.Handlers {

    const handlers: sipLibrary.api.Server.Handlers = {};

    (() => {

        const methodName = localApiDeclaration.sendMessage.methodName;
        type Params = localApiDeclaration.sendMessage.Params;
        type Response = localApiDeclaration.sendMessage.Response;

        let handler: sipLibrary.api.Server.Handler<Params, Response> = {
            "handler": async ({ viaDongleImei, toNumber, text }) => {

                let modem = modems.find(({ imei }) => imei === viaDongleImei);

                if (!types.matchModem(modem)) {

                    return { "success": false, "reason": "DISCONNECT" };

                }

                let sendDate: Date | undefined;

                try {

                    let boundTo = [];

                    sendDate = await Promise.race([
                        modem.sendMessage(toNumber, text),
                        new Promise<never>(
                            (_, reject) => (modem as Modem).evtTerminate.attachOnce(boundTo, () => reject())
                        )
                    ]);

                    modem.evtTerminate.detach(boundTo);

                } catch {

                    return { "success": false, "reason": "DISCONNECT" };

                }

                if (sendDate === undefined) {

                    return { "success": false, "reason": "CANNOT SEND" };

                }

                return { "success": true, sendDate };


            }
        };

        handlers[methodName] = handler;

    })();

    (() => {

        const methodName = localApiDeclaration.unlock.methodName;
        type Params = localApiDeclaration.unlock.Params;
        type Response = localApiDeclaration.unlock.Response;

        let handler: sipLibrary.api.Server.Handler<Params, Response> = {
            "handler": async (params) => {

                let dongleImei = params.dongleImei;

                let lockedModem = modems.find(({ imei }) => dongleImei === imei);

                if (!types.LockedModem.match(lockedModem)) {

                    return undefined;

                }

                try {

                    if (localApiDeclaration.unlock.matchPin(params)) {

                        return await lockedModem.performUnlock(params.pin);

                    } else {

                        return await lockedModem.performUnlock(params.puk, params.newPin);

                    }

                } catch{

                    return undefined;

                }

            }
        };

        handlers[methodName] = handler;

    })();

    (() => {

        const methodName = localApiDeclaration.getMessages.methodName;
        type Params = localApiDeclaration.getMessages.Params;
        type Response = localApiDeclaration.getMessages.Response;

        let handler: sipLibrary.api.Server.Handler<Params, Response> = {
            "handler": async (params) => {

                let response: Response = {};

                let from = 0;
                let to = Infinity;
                let flush = false;

                if (params.fromDate !== undefined) {
                    from = params.fromDate.getTime();
                }

                if (params.toDate !== undefined) {
                    to = params.toDate.getTime();
                }

                if (params.flush !== undefined) {
                    flush = params.flush;
                }

                let appData = await storage.read();

                for (let imsi of params.imsi ? [params.imsi] : Object.keys(appData.messages)) {

                    let messagesOfSim = appData.messages[imsi];

                    if (!messagesOfSim) {
                        throw new Error(`Sim imsi: ${imsi} was never connected`);
                    }

                    response[imsi] = [];

                    for (let message of [...messagesOfSim]) {

                        let time = message.date.getTime();

                        if ((time < from) || (time > to)) continue;

                        response[imsi].push(message);

                        if (flush) {
                            messagesOfSim.splice(messagesOfSim.indexOf(message), 1);
                        }


                    }

                }

                return response;


            }
        };

        handlers[methodName] = handler;

    })();

    return handlers;

}

function buildDongle(
    modem: Modem | types.LockedModem | Void
): dcTypes.Dongle | undefined {

    if (types.LockedModem.match(modem)) {

        return (function buildLockedDongle(lockedModem: types.LockedModem): dcTypes.Dongle.Locked {

            return {
                "imei": lockedModem.imei,
                "manufacturer": lockedModem.manufacturer,
                "model": lockedModem.model,
                "firmwareVersion": lockedModem.firmwareVersion,
                "sim": {
                    "iccid": lockedModem.iccid,
                    "pinState": lockedModem.pinState,
                    "tryLeft": lockedModem.tryLeft
                }
            };

        })(modem);

    } else if (types.matchModem(modem)) {

        return (function buildUsableDongle(modem: Modem): dcTypes.Dongle.Usable {

            let number = modem.number;
            let storageLeft = modem.storageLeft;

            let contacts: dcTypes.Sim.Contact[] = [];

            let imsi = modem.imsi;

            for (let contact of modem.contacts) {

                contacts.push({
                    "index": contact.index,
                    "name": {
                        "asStored": contact.name,
                        "full": contact.name
                    },
                    "number": {
                        "asStored": contact.number,
                        "localFormat": misc.toNationalNumber(contact.number, imsi)
                    }
                });

            }

            let digest = misc.computeSimStorageDigest(number, storageLeft, contacts);

            let simCountryAndSp = misc.getSimCountryAndSp(imsi);

            return {
                "imei": modem.imei,
                "manufacturer": modem.manufacturer,
                "model": modem.model,
                "firmwareVersion": modem.firmwareVersion,
                "isVoiceEnabled": modem.isVoiceEnabled,
                "sim": {
                    "iccid": modem.iccid,
                    imsi,
                    "country": simCountryAndSp ? ({
                        "iso": simCountryAndSp.iso,
                        "code": simCountryAndSp.code,
                        "name": simCountryAndSp.name
                    }) : undefined,
                    "serviceProvider": {
                        "fromImsi": simCountryAndSp ? simCountryAndSp.serviceProvider : undefined,
                        "fromNetwork": modem.serviceProviderName
                    },
                    "storage": {
                        "number": number ?
                            ({ "asStored": number, "localFormat": misc.toNationalNumber(number, imsi) })
                            : undefined,
                        "infos": {
                            "contactNameMaxLength": modem.contactNameMaxLength,
                            "numberMaxLength": modem.numberMaxLength,
                            storageLeft
                        },
                        contacts,
                        digest
                    }
                }
            };

        })(modem);

    } else {

        return undefined;

    }

}
