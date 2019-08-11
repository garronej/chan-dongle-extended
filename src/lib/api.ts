import { Modem, AtMessage } from "ts-gsm-modem";
import * as types from "./types";
import { InstallOptions } from "./InstallOptions";
import * as logger from "logger";
import {
    apiDeclaration, types as dcTypes, misc
} from "../chan-dongle-extended-client";
import localApiDeclaration = apiDeclaration.service;
import remoteApiDeclaration = apiDeclaration.controller;
import { isVoid, Void } from "trackable-map";
import * as sipLibrary from "ts-sip";
import { VoidSyncEvent } from "ts-events-extended";
import * as db from "./db";
import * as net from "net";

const debug= logger.debugFactory();

const sockets = new Set<sipLibrary.Socket>();

export async function beforeExit(){
    return beforeExit.impl();
}

export namespace beforeExit {
    export let impl= ()=> Promise.resolve();
}

export function launch(
    modems: types.Modems,
    staticModuleConfiguration: dcTypes.StaticModuleConfiguration
): Promise<void> {

    const { bind_addr, port } = InstallOptions.get();

    const server = new sipLibrary.api.Server(
        makeApiHandlers(modems),
        sipLibrary.api.Server.getDefaultLogger({
            "log": logger.log,
            "displayOnlyErrors": false,
            "hideKeepAlive": true
        })
    );

    const evtListening = new VoidSyncEvent();

    const netServer = net.createServer();

    netServer
        .once("error", error => { throw error; })
        .on("connection", async netSocket => {

            let socket = new sipLibrary.Socket(netSocket, true);

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
                        "dongles": Array.from(modems.values()).map(modem => buildDongleFromModem(modem)!),
                        staticModuleConfiguration
                    }
                ).catch(() => { });

            })();


        })
        .once("listening", () => {

            beforeExit.impl = () => new Promise<void>(resolve => {

                netServer.close(() => {

                    debug("Terminated!");

                    resolve();

                });

                for (const socket of sockets.values()) {
                    socket.destroy();
                }

            });

            evtListening.post();

        })
        .listen(port, bind_addr)
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
                        "dongle": buildDongleFromModem(newModem)
                    }
                );

            })();

            if (types.matchModem(newModem)) {

                onNewModem(newModem);

            }

        }
    );

    return new Promise<void>(
        resolve => evtListening.attachOnce(() => resolve())
    );

}

function broadcastRequest<Params, Response extends undefined>(
    methodName: string,
    params: Params
): void {

    for (let socket of sockets) {

        sipLibrary.api.client.sendRequest<Params, Response>(
            socket,
            methodName,
            params
        ).catch(() => { });

    }

}

function onNewModem(modem: Modem) {

    const dongleImei = modem.imei;

    modem.evtGsmConnectivityChange.attach(() => {

        const { methodName } = remoteApiDeclaration.notifyGsmConnectivityChange;
        type Params = remoteApiDeclaration.notifyGsmConnectivityChange.Params;
        type Response = remoteApiDeclaration.notifyGsmConnectivityChange.Response;

        for (let socket of sockets) {

            sipLibrary.api.client.sendRequest<Params, Response>(
                socket,
                methodName,
                { dongleImei }
            ).catch(() => { });

        }

    });

    modem.evtCellSignalStrengthTierChange.attach(() => {

        const { methodName } = remoteApiDeclaration.notifyCellSignalStrengthChange;
        type Params = remoteApiDeclaration.notifyCellSignalStrengthChange.Params;
        type Response = remoteApiDeclaration.notifyCellSignalStrengthChange.Response;

        for (let socket of sockets) {

            sipLibrary.api.client.sendRequest<Params, Response>(
                socket,
                methodName,
                {
                    dongleImei,
                    "cellSignalStrength":
                        buildDongleFromModem.modemCellSignalStrengthTierToDongleCellSignalStrength(
                            modem.getCurrentGsmConnectivityState().cellSignalStrength.tier
                        )
                }
            ).catch(() => { });

        }


    });

    modem.evtMessage.attach(async message => {

        const { methodName } = remoteApiDeclaration.notifyMessage;
        type Params = remoteApiDeclaration.notifyMessage.Params;
        type Response = remoteApiDeclaration.notifyMessage.Response;

        const response = await new Promise<Response>(resolve => {

            let tasks: Promise<void>[] = [];

            for (let socket of sockets) {

                tasks[tasks.length] = (async () => {

                    try {

                        const response = await sipLibrary.api.client.sendRequest<Params, Response>(
                            socket,
                            methodName,
                            { dongleImei, message }
                        );

                        if (response === "DO NOT SAVE MESSAGE") {
                            resolve(response);
                        }

                    } catch{ }

                })();

            }

            Promise.all(tasks).then(() => resolve("SAVE MESSAGE"));

        });

        if (response === "SAVE MESSAGE") {

            await db.messages.save(modem.imsi, message);

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

                const modem = modems.find(({ imei }) => imei === viaDongleImei);

                if (!types.matchModem(modem)) {

                    return { "success": false, "reason": "DISCONNECT" };

                }

                let sendDate: Date | undefined;

                try {

                    sendDate = await performModemAction(
                        modem, () => modem.sendMessage(toNumber, text)
                    );

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

        const methodName = localApiDeclaration.rebootDongle.methodName
        type Params = localApiDeclaration.rebootDongle.Params;
        type Response = localApiDeclaration.rebootDongle.Response;

        const handler: sipLibrary.api.Server.Handler<Params, Response> = {
            "handler": async ({ imei }) => {

                const modem = Array.from(modems.values())
                    .find(modem => modem.imei === imei);

                if (!modem) {

                    return undefined;

                }

                modem["__api_rebootDongle_called__"] = true;

                await modem.terminate();

                return undefined;

            }
        };

        handlers[methodName] = handler;

    })();

    (() => {

        const methodName = localApiDeclaration.getMessages.methodName;
        type Params = localApiDeclaration.getMessages.Params;
        type Response = localApiDeclaration.getMessages.Response;

        let handler: sipLibrary.api.Server.Handler<Params, Response> = {
            "handler": params => db.messages.retrieve(params)
        };

        handlers[methodName] = handler;

    })();

    (() => {

        const methodName = localApiDeclaration.createContact.methodName;
        type Params = localApiDeclaration.createContact.Params;
        type Response = localApiDeclaration.createContact.Response;

        const handler: sipLibrary.api.Server.Handler<Params, Response> = {
            "handler": async ({ imsi, number, name }) => {

                const modem = Array.from(modems.values())
                    .filter(types.matchModem)
                    .find(modem => modem.imsi === imsi)
                    ;

                if (!modem) {
                    return { "isSuccess": false };
                }

                let contact: dcTypes.Sim.Contact;

                try {

                    contact = await performModemAction(modem,
                        () => modem.createContact(number, name)
                    );

                } catch{

                    return { "isSuccess": false };

                }

                return { "isSuccess": true, contact };

            }
        };

        handlers[methodName] = handler;

    })();

    (() => {

        const methodName = localApiDeclaration.updateContact.methodName;
        type Params = localApiDeclaration.updateContact.Params;
        type Response = localApiDeclaration.updateContact.Response;

        const handler: sipLibrary.api.Server.Handler<Params, Response> = {
            "handler": async ({ imsi, index, new_number, new_name }) => {

                const modem = Array.from(modems.values())
                    .filter(types.matchModem)
                    .find(modem => modem.imsi === imsi)
                    ;

                if (!modem) {
                    return { "isSuccess": false };
                }

                let contact: dcTypes.Sim.Contact;

                try {

                    contact = await performModemAction(modem,
                        () => modem.updateContact(
                            index, { "name": new_name, "number": new_number }
                        )
                    );

                } catch{

                    return { "isSuccess": false };

                }

                return { "isSuccess": true, contact };

            }
        };

        handlers[methodName] = handler;

    })();

    (() => {

        const methodName = localApiDeclaration.deleteContact.methodName;
        type Params = localApiDeclaration.deleteContact.Params;
        type Response = localApiDeclaration.deleteContact.Response;

        const handler: sipLibrary.api.Server.Handler<Params, Response> = {
            "handler": async ({ imsi, index }) => {

                const modem = Array.from(modems.values())
                    .filter(types.matchModem)
                    .find(modem => modem.imsi === imsi)
                    ;

                if (!modem) {
                    return { "isSuccess": false };
                }

                try {

                    await performModemAction(modem,
                        () => modem.deleteContact(index)
                    );

                } catch{

                    return { "isSuccess": false };

                }

                return { "isSuccess": true };

            }
        };

        handlers[methodName] = handler;

    })();

    return handlers;

}

/** 
 * Perform an action on modem, throw if the Modem disconnect 
 * before the action is completed.
 * */
async function performModemAction<Response>(
    modem: Modem,
    action: () => Promise<Response>
): Promise<Response> {

    const boundTo = [];

    const response = await Promise.race([
        action(),
        new Promise<never>(
            (_, reject) => modem.evtTerminate.attachOnce(
                boundTo, () => reject(
                    new Error("Modem disconnect while performing action")
                )
            )
        )
    ]);

    modem.evtTerminate.detach(boundTo);

    return response;

}

function buildDongleFromModem(
    modem: Modem | types.LockedModem | Void
): dcTypes.Dongle | undefined {

    if (types.LockedModem.match(modem)) {

        return buildDongleFromModem.buildLockedDongleFromLockedModem(modem);

    } else if (types.matchModem(modem)) {

        return buildDongleFromModem.buildUsableDongleFromModem(modem);

    } else {

        return undefined;

    }

}

namespace buildDongleFromModem {

    export function buildLockedDongleFromLockedModem(
        lockedModem: types.LockedModem
    ): dcTypes.Dongle.Locked {

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

    }

    export function buildUsableDongleFromModem(
        modem: Modem
    ): dcTypes.Dongle.Usable {

        let number = modem.number;
        let storageLeft = modem.storageLeft;

        let contacts: dcTypes.Sim.Contact[] = modem.contacts;

        let imsi = modem.imsi;

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
                    "number": number || undefined,
                    "infos": {
                        "contactNameMaxLength": modem.contactNameMaxLength,
                        "numberMaxLength": modem.numberMaxLength,
                        storageLeft
                    },
                    contacts,
                    digest
                }
            },
            "cellSignalStrength": modemCellSignalStrengthTierToDongleCellSignalStrength(
                modem.getCurrentGsmConnectivityState().cellSignalStrength.tier
            ),
            "isGsmConnectivityOk": modem.isGsmConnectivityOk()
        };

    }

    export function modemCellSignalStrengthTierToDongleCellSignalStrength(
        tier: AtMessage.GsmOrUtranCellSignalStrengthTier
    ): dcTypes.Dongle.Usable.CellSignalStrength {
        switch (tier) {
            case "<=-113 dBm": return "VERY WEAK";
            case "-111 dBm": return "WEAK";
            case "–109 dBm to –53 dBm": return "GOOD";
            case "≥ –51 dBm": return "EXCELLENT";
            case "Unknown or undetectable": return "NULL";
        }
    }

}
