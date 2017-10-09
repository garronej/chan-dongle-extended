
import { Modem, UnlockResult } from "ts-gsm-modem";
import { Modems } from "./defs";

import { _private, Ami, DongleController as Dc } from "../chan-dongle-extended-client";
import api = _private.api
import Dongle = Dc.Dongle;
import LockedDongle = Dc.LockedDongle;
import ActiveDongle = Dc.ActiveDongle;

import * as lt from "./defs";
import LockedModem = lt.LockedModem;
import matchModem = lt.matchModem;
import matchLockedModem = lt.matchLockedModem;

import { chanDongleConfManager } from "./chanDongleConfManager";
import { isVoid, Void } from "trackable-map";

import * as storage from "./appStorage";

import * as _debug from "debug";
let debug = _debug("_api");

export function start(modems: Modems, ami: Ami) {

    const server = Ami.getInstance().apiServer;

    modems.evt.attach(([newModem, _, oldModem]) => {

        debug("Dongle", JSON.stringify(buildDongle(newModem), null, 2));

        let dongleImei: string;

        if (isVoid(newModem)) {
            if (isVoid(oldModem)) throw "cast";
            dongleImei = oldModem.imei;
        } else {
            if (!isVoid(oldModem)) throw "cast";
            dongleImei = newModem.imei;
        }

        let eventData: api.Events.updateMap.Data = {
            dongleImei,
            "dongle": buildDongle(newModem)
        };

        server.postEvent(api.Events.updateMap.name, eventData);

        if (!matchModem(newModem)) return;

        newModem.evtMessage.attach(
            async message => {

                let appData = await storage.read();

                if (!appData.messages[newModem.imsi]) {
                    appData.messages[newModem.imsi] = [message];
                } else {
                    appData.messages[newModem.imsi].push(message);
                }

                appData.release();

                let eventData: api.Events.message.Data = { dongleImei, message };

                server.postEvent(api.Events.message.name, eventData);

            }
        );

        newModem.evtMessageStatusReport.attach(statusReport => {

            let eventData: api.Events.statusReport.Data = { dongleImei, statusReport };

            server.postEvent(api.Events.statusReport.name, eventData);

        });


    });

    server.evtRequest.attach(
        async ({ method, params, resolve, reject }) => {

            try {
                resolve(await handlers[method](params));
            } catch (error) {
                reject(error);
            }

        }
    );

    const moduleConfiguration = (() => {

        let { general, defaults } = chanDongleConfManager.getConfig();

        return { general, defaults }

    })();

    const handlers: { [method: string]: (params: any) => Promise<any> } = {};

    handlers[api.sendMessage.method] =
        async (params: api.sendMessage.Params): Promise<api.sendMessage.Response> => {

            let { viaDongleImei, toNumber, text } = params;

            let modem = modems.find(
                modem => modem.imei === viaDongleImei
            );

            if (!matchModem(modem)) {
                throw new Error("Dongle not available");
            }

            let sendDate: Date | undefined;

            try {

                sendDate = await Promise.race([
                    modem.sendMessage(toNumber, text),
                    new Promise<never>((_, reject) => (modem as Modem).evtTerminate.attachOnce(params, reject))
                ]);

                modem.evtTerminate.detach(params);

            } catch (error) {

                return { "success": false, "reason": "DISCONNECT" };

            }

            if (sendDate === undefined) {

                return { "success": false, "reason": "CANNOT SEND" };

            }

            return { "success": true, sendDate };

        }

    handlers[api.initialize.method] =
        async (): Promise<api.initialize.Response> => {

            return {
                "dongles": modems.valuesAsArray().map(modem => buildDongle(modem)!),
                moduleConfiguration
            };

        }

    handlers[api.unlock.method] =
        (params: api.unlock.Params): Promise<api.unlock.Response> => {

            let dongleImei = params.dongleImei;

            let lockedModem = modems.find(({ imei }) => dongleImei === imei);

            if (!matchLockedModem(lockedModem)) {

                throw new Error("No such dongle to unlock");

            }

            if (api.unlock.matchPin(params)) {

                return lockedModem.performUnlock(params.pin);

            } else {

                return lockedModem.performUnlock(params.puk, params.newPin);

            }

        };

    handlers[api.getMessages.method] =
        async (params: api.getMessages.Params): Promise<api.getMessages.Response> => {

            let matchImsi = (imsi: string) => true;
            let from = 0;
            let to = Infinity;
            let flush = false;

            if (params.imsi !== undefined) {
                matchImsi = imsi => imsi === params.imsi;
            }

            if (params.fromDate !== undefined) {
                from = params.fromDate.getTime();
            }

            if (params.toDate !== undefined) {
                to = params.toDate.getTime();
            }

            if (params.flush !== undefined) {
                flush = params.flush;
            }

            let response: api.getMessages.Response = {};

            let appData = await storage.read();

            for (let imsi of Object.keys(appData.messages)) {

                if (!matchImsi(imsi)) continue;

                response[imsi] = [];

                let messages = appData.messages[imsi];

                for (let message of [...messages]) {

                    let time = message.date.getTime();

                    if (time < from) continue;
                    if (time > to) continue;

                    response[imsi].push(message);

                    if (flush) {
                        messages.splice(messages.indexOf(message), 1);
                    }

                }

            }

            appData.release();

            return response;

        }

}

function buildDongle(modem: Modem | LockedModem | Void): Dongle | undefined {

    if (matchLockedModem(modem)) {

        return (function buildLockedDongle(lockedModem: LockedModem): LockedDongle {

            return {
                "imei": lockedModem.imei,
                "sim": {
                    "iccid": lockedModem.iccid,
                    "pinState": lockedModem.pinState,
                    "tryLeft": lockedModem.tryLeft
                }
            };

        })(modem);

    } else if (matchModem(modem)) {

        return (function buildActiveDongle(modem: Modem): ActiveDongle {

            return {
                "imei": modem.imei,
                "isVoiceEnabled": modem.isVoiceEnabled,
                "sim": {
                    "iccid": modem.iccid,
                    "imsi": modem.imsi,
                    "number": modem.number,
                    "serviceProvider": modem.serviceProviderName,
                    "phonebook": {
                        "infos": {
                            "contactNameMaxLength": modem.contactNameMaxLength,
                            "numberMaxLength": modem.numberMaxLength,
                            "storageLeft": modem.storageLeft,
                        },
                        "contacts": modem.contacts
                    }
                }
            };

        })(modem);

    } else {

        return undefined;

    }

}
