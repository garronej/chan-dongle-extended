
import { Modem } from "ts-gsm-modem";
import { Modems } from "./defs";

import { 
    Ami, apiDeclaration as api, types, misc
 } from "../chan-dongle-extended-client";

import * as lt from "./defs";
import LockedModem = lt.LockedModem;
import matchModem = lt.matchModem;
import matchLockedModem = lt.matchLockedModem;

import { chanDongleConfManager } from "./chanDongleConfManager";
import { isVoid, Void } from "trackable-map";

import * as storage from "./appStorage";

import * as _debug from "debug";
let debug = _debug("_api");

const serviceUpSince= Date.now();

export function start(modems: Modems, ami: Ami) {

    const server = Ami.getInstance().createApiServer(api.id);

    (async ()=>{

        let eventData: api.Events.periodicalSignal.Data={ serviceUpSince };

        while(true){

            server.postEvent(api.Events.periodicalSignal.name, eventData);

            await new Promise<void>(
                resolve=> setTimeout(
                    ()=> resolve(), 
                    api.Events.periodicalSignal.interval
                )
            );

        }

    })();


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

        let imsi = newModem.imsi;

        (async ()=>{

                let appData = await storage.read();

                if (!appData.messages[imsi]) {
                    appData.messages[imsi] = [];
                }

        })();

        newModem.evtMessage.attach(
            async message => {

                let appData = await storage.read();

                appData.messages[imsi].push(message);

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
                moduleConfiguration,
                serviceUpSince
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

            let response: api.getMessages.Response = {};

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

            for( let imsi of params.imsi?[params.imsi]:Object.keys(appData.messages) ){

                let messagesOfSim= appData.messages[imsi];

                if(!messagesOfSim){
                    throw new Error(`Sim imsi: ${imsi} was never connected`);
                }

                response[imsi]= [];

                for( let message of [...messagesOfSim] ){

                    let time= message.date.getTime();

                    if ((time < from) || ( time > to )) continue;

                    response[imsi].push(message);

                    if( flush ){
                        messagesOfSim.splice(messagesOfSim.indexOf(message), 1);
                    }


                }

            }

            return response;

        }

}

function buildDongle(modem: Modem | LockedModem | Void): types.Dongle | undefined {

    if (matchLockedModem(modem)) {

        return (function buildLockedDongle(lockedModem: LockedModem): types.Dongle.Locked {

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

    } else if (matchModem(modem)) {

        return (function buildUsableDongle(modem: Modem): types.Dongle.Usable {

            let number= modem.number;
            let storageLeft= modem.storageLeft;

            let contacts: types.Sim.Contact[]= [];

            let imsi= modem.imsi;

            for( let contact of modem.contacts ){

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

            let digest= misc.computeSimStorageDigest(number, storageLeft, contacts);

            let simCountryAndSp= misc.getSimCountryAndSp(imsi);

            return {
                "imei": modem.imei,
                "manufacturer": modem.manufacturer,
                "model": modem.model,
                "firmwareVersion": modem.firmwareVersion,
                "isVoiceEnabled": modem.isVoiceEnabled,
                "sim": {
                    "iccid": modem.iccid,
                    imsi,
                    "country": simCountryAndSp?({
                        "iso": simCountryAndSp.iso,
                        "code": simCountryAndSp.code,
                        "name": simCountryAndSp.name
                    }):undefined,
                    "serviceProvider": {
                        "fromImsi": simCountryAndSp?simCountryAndSp.serviceProvider:undefined,
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
