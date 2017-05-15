"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var main_1 = require("./main");
var appStorage_1 = require("./appStorage");
var chan_dongle_extended_client_1 = require("chan-dongle-extended-client");
var Event = chan_dongle_extended_client_1.UserEvent.Event;
var Response = chan_dongle_extended_client_1.UserEvent.Response;
var Request = chan_dongle_extended_client_1.UserEvent.Request;
var dialplan_1 = require("./dialplan");
var _debug = require("debug");
var debug = _debug("_main.ami");
var client = chan_dongle_extended_client_1.DongleExtendedClient.localhost();
client.evtUserEvent.attach(function (_a) {
    var actionid = _a.actionid, event = _a.event, action = _a.action, userevent = _a.userevent, privilege = _a.privilege, prettyEvt = __rest(_a, ["actionid", "event", "action", "userevent", "privilege"]);
    return debug(prettyEvt);
});
main_1.activeModems.evtSet.attach(function (_a) {
    var _b = __read(_a, 2), _c = _b[0], modem = _c.modem, dongleName = _c.dongleName, imei = _b[1];
    return __awaiter(_this, void 0, void 0, function () {
        var _this = this;
        var appData, imsi;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    debug("New active modem " + imei);
                    if (!modem.pin) return [3 /*break*/, 2];
                    debug("Persistent storing of pin: " + modem.pin);
                    if (modem.iccidAvailableBeforeUnlock)
                        debug("for SIM ICCID: " + modem.iccid);
                    else
                        debug("for dongle IMEI: " + modem.imei + ", because SIM ICCID is not readable with this dongle when SIM is locked");
                    return [4 /*yield*/, appStorage_1.appStorage.read()];
                case 1:
                    appData = _a.sent();
                    appData.pins[modem.iccidAvailableBeforeUnlock ? modem.iccid : modem.imei] = modem.pin;
                    appData.release();
                    _a.label = 2;
                case 2:
                    client.postUserEventAction(Event.NewActiveDongle.buildAction(imei, modem.iccid, modem.imsi, modem.number || "", modem.serviceProviderName || ""));
                    imsi = modem.imsi;
                    modem.evtMessageStatusReport.attach(function (statusReport) { return __awaiter(_this, void 0, void 0, function () {
                        var messageId, dischargeTime, isDelivered, status, recipient;
                        return __generator(this, function (_a) {
                            messageId = statusReport.messageId, dischargeTime = statusReport.dischargeTime, isDelivered = statusReport.isDelivered, status = statusReport.status, recipient = statusReport.recipient;
                            client.postUserEventAction(Event.MessageStatusReport.buildAction(imei, messageId.toString(), dischargeTime.toISOString(), isDelivered ? "true" : "false", status, recipient));
                            dialplan_1.dialplan.notifyStatusReport({
                                "name": dongleName,
                                "number": modem.number || "",
                                imei: imei,
                                imsi: imsi,
                                "provider": modem.serviceProviderName || ""
                            }, statusReport);
                            return [2 /*return*/];
                        });
                    }); });
                    modem.evtMessage.attach(function (message) { return __awaiter(_this, void 0, void 0, function () {
                        var appData, number, date, text;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, appStorage_1.appStorage.read()];
                                case 1:
                                    appData = _a.sent();
                                    if (!appData.messages[imsi])
                                        appData.messages[imsi] = [];
                                    appData.messages[imsi].push(message);
                                    appData.release();
                                    number = message.number, date = message.date, text = message.text;
                                    client.postUserEventAction(chan_dongle_extended_client_1.UserEvent.Event.NewMessage.buildAction(imei, number, date.toISOString(), text));
                                    dialplan_1.dialplan.notifySms({
                                        "name": dongleName,
                                        "number": modem.number || "",
                                        imei: imei,
                                        imsi: imsi,
                                        "provider": modem.serviceProviderName || ""
                                    }, message);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    });
});
main_1.activeModems.evtDelete.attach(function (_a) {
    var _b = __read(_a, 1), modem = _b[0].modem;
    return client.postUserEventAction(Event.DongleDisconnect.buildAction(modem.imei, modem.iccid, modem.imsi, modem.number || "", modem.serviceProviderName || ""));
});
main_1.lockedModems.evtSet.attach(function (_a) {
    var _b = __read(_a, 2), _c = _b[0], iccid = _c.iccid, pinState = _c.pinState, tryLeft = _c.tryLeft, callback = _c.callback, imei = _b[1];
    return __awaiter(_this, void 0, void 0, function () {
        var appData, pin;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    debug("Locked modem IMEI: " + imei + ",ICCID: " + iccid + ", " + pinState + ", " + tryLeft);
                    return [4 /*yield*/, appStorage_1.appStorage.read()];
                case 1:
                    appData = _a.sent();
                    pin = appData.pins[iccid || imei];
                    if (pin)
                        delete appData.pins[iccid || imei];
                    appData.release();
                    if (pin && pinState === "SIM PIN" && tryLeft === 3) {
                        debug("Using stored pin " + pin + " for unlocking dongle");
                        main_1.lockedModems.delete(imei);
                        callback(pin);
                    }
                    else
                        client.postUserEventAction(chan_dongle_extended_client_1.UserEvent.Event.RequestUnlockCode.buildAction(imei, iccid, pinState, tryLeft.toString()));
                    return [2 /*return*/];
            }
        });
    });
});
client.evtUserEvent.attach(Request.matchEvt, function (evtRequest) { return __awaiter(_this, void 0, void 0, function () {
    var actionid, command, replyError, modem, text, messageId, imei, _a, modem, accessPoint, id, _b, _c, imei, _d, iccid, pinState, tryLeft, e_1_1, imsi, appData, messages, messages_1, messages_1_1, _e, number, date, text, e_2_1, modem, contacts, contacts_1, contacts_1_1, _f, index, name_1, number, e_3_1, modem, name_2, number, contact, modem, index, _g, _h, imei, modem, iccid, imsi, number, serviceProviderName, e_4_1, imei, lockedModem, pinState, tryLeft, unlockCallback, pin, puk, newpin, e_1, _j, e_2, _k, e_3, _l, e_4, _m;
    return __generator(this, function (_o) {
        switch (_o.label) {
            case 0:
                actionid = evtRequest.actionid, command = evtRequest.command;
                replyError = function (errorMessage) { return client.postUserEventAction(Response.buildAction(command, actionid, errorMessage)); };
                if (!Request.SendMessage.matchEvt(evtRequest)) return [3 /*break*/, 2];
                if (!main_1.activeModems.has(evtRequest.imei))
                    return [2 /*return*/, replyError("Dongle imei: " + evtRequest.imei + " not found")];
                modem = main_1.activeModems.get(evtRequest.imei).modem;
                text = Request.SendMessage.reassembleText(evtRequest);
                return [4 /*yield*/, modem.sendMessage(evtRequest.number, text)];
            case 1:
                messageId = _o.sent();
                if (isNaN(messageId))
                    return [2 /*return*/, replyError("Message not send")];
                client.postUserEventAction(Response.SendMessage.buildAction(actionid, messageId.toString()));
                return [3 /*break*/, 50];
            case 2:
                if (!Request.UpdateNumber.matchEvt(evtRequest)) return [3 /*break*/, 4];
                imei = evtRequest.imei;
                if (!main_1.activeModems.has(imei))
                    return [2 /*return*/, replyError("Dongle imei: " + imei + " not found")];
                _a = main_1.activeModems.get(imei), modem = _a.modem, accessPoint = _a.accessPoint;
                return [4 /*yield*/, modem.writeNumber(evtRequest.number)];
            case 3:
                _o.sent();
                client.postUserEventAction(Response.buildAction(Request.UpdateNumber.keyword, actionid));
                id = "Dongle" + imei.substring(0, 3) + imei.substring(imei.length - 3);
                client.ami.postAction({
                    "action": "DongleRestart",
                    "device": id,
                    "when": "gracefully"
                });
                return [3 /*break*/, 50];
            case 4:
                if (!Request.GetLockedDongles.matchEvt(evtRequest)) return [3 /*break*/, 14];
                return [4 /*yield*/, client.postUserEventAction(Response.GetLockedDongles.Infos.buildAction(actionid, main_1.lockedModems.size.toString()))];
            case 5:
                _o.sent();
                _o.label = 6;
            case 6:
                _o.trys.push([6, 11, 12, 13]);
                _b = __values(main_1.lockedModems.keysAsArray()), _c = _b.next();
                _o.label = 7;
            case 7:
                if (!!_c.done) return [3 /*break*/, 10];
                imei = _c.value;
                _d = main_1.lockedModems.get(imei), iccid = _d.iccid, pinState = _d.pinState, tryLeft = _d.tryLeft;
                return [4 /*yield*/, client.postUserEventAction(Response.GetLockedDongles.Entry.buildAction(actionid, imei, iccid, pinState, tryLeft.toString()))];
            case 8:
                _o.sent();
                _o.label = 9;
            case 9:
                _c = _b.next();
                return [3 /*break*/, 7];
            case 10: return [3 /*break*/, 13];
            case 11:
                e_1_1 = _o.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 13];
            case 12:
                try {
                    if (_c && !_c.done && (_j = _b.return)) _j.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
                return [7 /*endfinally*/];
            case 13: return [3 /*break*/, 50];
            case 14:
                if (!Request.GetMessages.matchEvt(evtRequest)) return [3 /*break*/, 25];
                if (!main_1.activeModems.has(evtRequest.imei))
                    return [2 /*return*/, replyError("Dongle imei: " + evtRequest.imei + " not found")];
                imsi = main_1.activeModems.get(evtRequest.imei).modem.imsi;
                return [4 /*yield*/, appStorage_1.appStorage.read()];
            case 15:
                appData = _o.sent();
                messages = appData.messages[imsi] || [];
                if (evtRequest.flush === "true" && messages.length)
                    delete appData.messages[imsi];
                appData.release();
                return [4 /*yield*/, client.postUserEventAction(Response.GetMessages.Infos.buildAction(actionid, messages.length.toString()))];
            case 16:
                _o.sent();
                _o.label = 17;
            case 17:
                _o.trys.push([17, 22, 23, 24]);
                messages_1 = __values(messages), messages_1_1 = messages_1.next();
                _o.label = 18;
            case 18:
                if (!!messages_1_1.done) return [3 /*break*/, 21];
                _e = messages_1_1.value, number = _e.number, date = _e.date, text = _e.text;
                return [4 /*yield*/, client.postUserEventAction(Response.GetMessages.Entry.buildAction(actionid, number, date.toISOString(), text))];
            case 19:
                _o.sent();
                _o.label = 20;
            case 20:
                messages_1_1 = messages_1.next();
                return [3 /*break*/, 18];
            case 21: return [3 /*break*/, 24];
            case 22:
                e_2_1 = _o.sent();
                e_2 = { error: e_2_1 };
                return [3 /*break*/, 24];
            case 23:
                try {
                    if (messages_1_1 && !messages_1_1.done && (_k = messages_1.return)) _k.call(messages_1);
                }
                finally { if (e_2) throw e_2.error; }
                return [7 /*endfinally*/];
            case 24: return [3 /*break*/, 50];
            case 25:
                if (!Request.GetSimPhonebook.matchEvt(evtRequest)) return [3 /*break*/, 35];
                if (!main_1.activeModems.has(evtRequest.imei))
                    return [2 /*return*/, replyError("Dongle imei: " + evtRequest.imei + " not found")];
                modem = main_1.activeModems.get(evtRequest.imei).modem;
                contacts = modem.contacts;
                return [4 /*yield*/, client.postUserEventAction(Response.GetSimPhonebook.Infos.buildAction(actionid, modem.contactNameMaxLength.toString(), modem.numberMaxLength.toString(), modem.storageLeft.toString(), contacts.length.toString()))];
            case 26:
                _o.sent();
                _o.label = 27;
            case 27:
                _o.trys.push([27, 32, 33, 34]);
                contacts_1 = __values(contacts), contacts_1_1 = contacts_1.next();
                _o.label = 28;
            case 28:
                if (!!contacts_1_1.done) return [3 /*break*/, 31];
                _f = contacts_1_1.value, index = _f.index, name_1 = _f.name, number = _f.number;
                return [4 /*yield*/, client.postUserEventAction(Response.GetSimPhonebook.Entry.buildAction(actionid, index.toString(), name_1, number))];
            case 29:
                _o.sent();
                _o.label = 30;
            case 30:
                contacts_1_1 = contacts_1.next();
                return [3 /*break*/, 28];
            case 31: return [3 /*break*/, 34];
            case 32:
                e_3_1 = _o.sent();
                e_3 = { error: e_3_1 };
                return [3 /*break*/, 34];
            case 33:
                try {
                    if (contacts_1_1 && !contacts_1_1.done && (_l = contacts_1.return)) _l.call(contacts_1);
                }
                finally { if (e_3) throw e_3.error; }
                return [7 /*endfinally*/];
            case 34: return [3 /*break*/, 50];
            case 35:
                if (!Request.CreateContact.matchEvt(evtRequest)) return [3 /*break*/, 37];
                if (!main_1.activeModems.has(evtRequest.imei))
                    return [2 /*return*/, replyError("Dongle imei: " + evtRequest.imei + " not found")];
                modem = main_1.activeModems.get(evtRequest.imei).modem;
                name_2 = evtRequest.name, number = evtRequest.number;
                //TODO: validate params.
                if (!modem.storageLeft)
                    return [2 /*return*/, replyError("No storage space left on SIM")];
                return [4 /*yield*/, modem.createContact(number, name_2)];
            case 36:
                contact = _o.sent();
                client.postUserEventAction(Response.CreateContact.buildAction(actionid, contact.index.toString(), contact.name, contact.number));
                return [3 /*break*/, 50];
            case 37:
                if (!Request.DeleteContact.matchEvt(evtRequest)) return [3 /*break*/, 39];
                if (!main_1.activeModems.has(evtRequest.imei))
                    return [2 /*return*/, replyError("Dongle imei: " + evtRequest.imei + " not found")];
                modem = main_1.activeModems.get(evtRequest.imei).modem;
                index = parseInt(evtRequest.index);
                if (!modem.getContact(index))
                    return [2 /*return*/, replyError("Contact index " + index + " does not exist")];
                return [4 /*yield*/, modem.deleteContact(index)];
            case 38:
                _o.sent();
                client.postUserEventAction(Response.buildAction(Request.DeleteContact.keyword, actionid));
                return [3 /*break*/, 50];
            case 39:
                if (!Request.GetActiveDongles.matchEvt(evtRequest)) return [3 /*break*/, 49];
                return [4 /*yield*/, client.postUserEventAction(Response.GetActiveDongles.Infos.buildAction(actionid, main_1.activeModems.size.toString()))];
            case 40:
                _o.sent();
                _o.label = 41;
            case 41:
                _o.trys.push([41, 46, 47, 48]);
                _g = __values(main_1.activeModems.keysAsArray()), _h = _g.next();
                _o.label = 42;
            case 42:
                if (!!_h.done) return [3 /*break*/, 45];
                imei = _h.value;
                modem = main_1.activeModems.get(imei).modem;
                iccid = modem.iccid, imsi = modem.imsi, number = modem.number, serviceProviderName = modem.serviceProviderName;
                return [4 /*yield*/, client.postUserEventAction(Response.GetActiveDongles.Entry.buildAction(actionid, imei, iccid, imsi, number || "", serviceProviderName || ""))];
            case 43:
                _o.sent();
                _o.label = 44;
            case 44:
                _h = _g.next();
                return [3 /*break*/, 42];
            case 45: return [3 /*break*/, 48];
            case 46:
                e_4_1 = _o.sent();
                e_4 = { error: e_4_1 };
                return [3 /*break*/, 48];
            case 47:
                try {
                    if (_h && !_h.done && (_m = _g.return)) _m.call(_g);
                }
                finally { if (e_4) throw e_4.error; }
                return [7 /*endfinally*/];
            case 48: return [3 /*break*/, 50];
            case 49:
                if (Request.UnlockDongle.matchEvt(evtRequest)) {
                    imei = evtRequest.imei;
                    lockedModem = main_1.lockedModems.get(imei);
                    if (!lockedModem)
                        return [2 /*return*/, replyError("Dongle imei: " + evtRequest.imei + " not found")];
                    pinState = lockedModem.pinState, tryLeft = lockedModem.tryLeft;
                    unlockCallback = lockedModem.callback;
                    if (pinState === "SIM PIN") {
                        pin = evtRequest.pin;
                        if (!pin)
                            return [2 /*return*/, replyError("Wrong parameter, no PIN provided")];
                        unlockCallback(pin);
                    }
                    else if (pinState === "SIM PUK") {
                        puk = evtRequest.puk, newpin = evtRequest.newpin;
                        if (!puk || !newpin)
                            return [2 /*return*/, replyError("Wrong parameter, no PUK and NEW PIN requested")];
                        unlockCallback(puk, newpin);
                    }
                    else
                        return [2 /*return*/, replyError(pinState + ", not supported")];
                    main_1.lockedModems.delete(imei);
                    client.postUserEventAction(Response.buildAction(Request.UnlockDongle.keyword, actionid));
                }
                else
                    return [2 /*return*/, replyError("Unknown command " + command)];
                _o.label = 50;
            case 50: return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=main.ami.js.map