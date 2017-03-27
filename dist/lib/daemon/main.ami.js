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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var main_1 = require("./main");
var AmiUserEvent_1 = require("../shared/AmiUserEvent");
var Event = AmiUserEvent_1.UserEvent.Event;
var Response = AmiUserEvent_1.UserEvent.Response;
var Request = AmiUserEvent_1.UserEvent.Request;
var Storage_1 = require("./lib/Storage");
var AmiClient_1 = require("../client/AmiClient");
var _debug = require("debug");
var debug = _debug("_main.ami");
var amiClient = AmiClient_1.AmiClient.localhost();
//ami.keepConnected();
amiClient.evtAmiUserEvent.attach(function (_a) {
    var actionid = _a.actionid, event = _a.event, action = _a.action, userevent = _a.userevent, privilege = _a.privilege, prettyEvt = __rest(_a, ["actionid", "event", "action", "userevent", "privilege"]);
    return debug(prettyEvt);
});
main_1.activeModems.evtSet.attach(function (_a) {
    var modem = _a[0].modem, imei = _a[1];
    return __awaiter(_this, void 0, void 0, function () {
        var _this = this;
        var data;
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
                    return [4 /*yield*/, Storage_1.Storage.read()];
                case 1:
                    data = _a.sent();
                    data.pins[modem.iccidAvailableBeforeUnlock ? modem.iccid : modem.imei] = modem.pin;
                    data.release();
                    _a.label = 2;
                case 2:
                    amiClient.postUserEventAction(Event.NewActiveDongle.buildAction(imei, modem.iccid, modem.imsi, modem.number || ""));
                    modem.evtMessageStatusReport.attach(function (_a) {
                        var messageId = _a.messageId, dischargeTime = _a.dischargeTime, isDelivered = _a.isDelivered, status = _a.status;
                        return amiClient.postUserEventAction(Event.MessageStatusReport.buildAction(imei, messageId.toString(), dischargeTime.toISOString(), isDelivered ? "true" : "false", status));
                    });
                    modem.evtMessage.attach(function (message) { return __awaiter(_this, void 0, void 0, function () {
                        var data, imsi, number, date, text;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, Storage_1.Storage.read()];
                                case 1:
                                    data = _a.sent();
                                    imsi = modem.imsi;
                                    if (!data.messages[imsi])
                                        data.messages[imsi] = [];
                                    data.messages[imsi].push(message);
                                    data.release();
                                    number = message.number, date = message.date, text = message.text;
                                    amiClient.postUserEventAction(AmiUserEvent_1.UserEvent.Event.NewMessage.buildAction(imei, number, date.toISOString(), text));
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
    var modem = _a[0].modem, imei = _a[1];
    return amiClient.postUserEventAction(Event.DongleDisconnect.buildAction(imei, modem.iccid, modem.imsi, modem.number || ""));
});
main_1.lockedModems.evtSet.attach(function (_a) {
    var _b = _a[0], iccid = _b.iccid, pinState = _b.pinState, tryLeft = _b.tryLeft, callback = _b.callback, imei = _a[1];
    return __awaiter(_this, void 0, void 0, function () {
        var data, pin;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    debug("Locked modem IMEI: " + imei + ",ICCID: " + iccid + ", " + pinState + ", " + tryLeft);
                    return [4 /*yield*/, Storage_1.Storage.read()];
                case 1:
                    data = _a.sent();
                    pin = data.pins[iccid || imei];
                    if (pin)
                        delete data.pins[iccid || imei];
                    data.release();
                    if (pin && pinState === "SIM PIN" && tryLeft === 3) {
                        debug("Using stored pin " + pin + " for unlocking dongle");
                        main_1.lockedModems.delete(imei);
                        callback(pin);
                    }
                    else
                        amiClient.postUserEventAction(AmiUserEvent_1.UserEvent.Event.RequestUnlockCode.buildAction(imei, iccid, pinState, tryLeft.toString()));
                    return [2 /*return*/];
            }
        });
    });
});
amiClient.evtAmiUserEvent.attach(Request.matchEvt, function (evtRequest) { return __awaiter(_this, void 0, void 0, function () {
    var actionid, command, replyError, modem, text, messageId, _i, _a, imei, _b, iccid, pinState, tryLeft, imsi, data, messages, _c, messages_1, _d, number, date, text, modem, contacts, _e, contacts_1, _f, index, name_1, number, modem, name_2, number, contact, modem, index, _g, _h, imei, modem, iccid, imsi, number, imei, lockedModem, pinState, tryLeft, unlockCallback, pin, puk, newpin;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                actionid = evtRequest.actionid, command = evtRequest.command;
                replyError = function (errorMessage) { return amiClient.postUserEventAction(Response.buildAction(command, actionid, errorMessage)); };
                if (!Request.SendMessage.matchEvt(evtRequest)) return [3 /*break*/, 2];
                if (!main_1.activeModems.has(evtRequest.imei))
                    return [2 /*return*/, replyError("Dongle imei: " + evtRequest.imei + " not found")];
                modem = main_1.activeModems.get(evtRequest.imei).modem;
                text = Request.SendMessage.reassembleText(evtRequest);
                return [4 /*yield*/, modem.sendMessage(evtRequest.number, text)];
            case 1:
                messageId = _j.sent();
                if (isNaN(messageId))
                    return [2 /*return*/, replyError("Message not send")];
                amiClient.postUserEventAction(Response.SendMessage.buildAction(actionid, messageId.toString()));
                return [3 /*break*/, 32];
            case 2:
                if (!Request.GetLockedDongles.matchEvt(evtRequest)) return [3 /*break*/, 8];
                return [4 /*yield*/, amiClient.postUserEventAction(Response.GetLockedDongles.Infos.buildAction(actionid, main_1.lockedModems.size.toString())).promise];
            case 3:
                _j.sent();
                _i = 0, _a = main_1.lockedModems.keysAsArray();
                _j.label = 4;
            case 4:
                if (!(_i < _a.length)) return [3 /*break*/, 7];
                imei = _a[_i];
                _b = main_1.lockedModems.get(imei), iccid = _b.iccid, pinState = _b.pinState, tryLeft = _b.tryLeft;
                return [4 /*yield*/, amiClient.postUserEventAction(Response.GetLockedDongles.Entry.buildAction(actionid, imei, iccid, pinState, tryLeft.toString())).promise];
            case 5:
                _j.sent();
                _j.label = 6;
            case 6:
                _i++;
                return [3 /*break*/, 4];
            case 7: return [3 /*break*/, 32];
            case 8:
                if (!Request.GetMessages.matchEvt(evtRequest)) return [3 /*break*/, 15];
                if (!main_1.activeModems.has(evtRequest.imei))
                    return [2 /*return*/, replyError("Dongle imei: " + evtRequest.imei + " not found")];
                imsi = main_1.activeModems.get(evtRequest.imei).modem.imsi;
                return [4 /*yield*/, Storage_1.Storage.read()];
            case 9:
                data = _j.sent();
                messages = data.messages[imsi] || [];
                if (evtRequest.flush === "true" && messages.length)
                    delete data.messages[imsi];
                data.release();
                return [4 /*yield*/, amiClient.postUserEventAction(Response.GetMessages.Infos.buildAction(actionid, messages.length.toString())).promise];
            case 10:
                _j.sent();
                _c = 0, messages_1 = messages;
                _j.label = 11;
            case 11:
                if (!(_c < messages_1.length)) return [3 /*break*/, 14];
                _d = messages_1[_c], number = _d.number, date = _d.date, text = _d.text;
                return [4 /*yield*/, amiClient.postUserEventAction(Response.GetMessages.Entry.buildAction(actionid, number, date.toISOString(), text)).promise];
            case 12:
                _j.sent();
                _j.label = 13;
            case 13:
                _c++;
                return [3 /*break*/, 11];
            case 14: return [3 /*break*/, 32];
            case 15:
                if (!Request.GetSimPhonebook.matchEvt(evtRequest)) return [3 /*break*/, 21];
                if (!main_1.activeModems.has(evtRequest.imei))
                    return [2 /*return*/, replyError("Dongle imei: " + evtRequest.imei + " not found")];
                modem = main_1.activeModems.get(evtRequest.imei).modem;
                contacts = modem.contacts;
                return [4 /*yield*/, amiClient.postUserEventAction(Response.GetSimPhonebook.Infos.buildAction(actionid, modem.contactNameMaxLength.toString(), modem.numberMaxLength.toString(), modem.storageLeft.toString(), contacts.length.toString())).promise];
            case 16:
                _j.sent();
                _e = 0, contacts_1 = contacts;
                _j.label = 17;
            case 17:
                if (!(_e < contacts_1.length)) return [3 /*break*/, 20];
                _f = contacts_1[_e], index = _f.index, name_1 = _f.name, number = _f.number;
                return [4 /*yield*/, amiClient.postUserEventAction(Response.GetSimPhonebook.Entry.buildAction(actionid, index.toString(), name_1, number)).promise];
            case 18:
                _j.sent();
                _j.label = 19;
            case 19:
                _e++;
                return [3 /*break*/, 17];
            case 20: return [3 /*break*/, 32];
            case 21:
                if (!Request.CreateContact.matchEvt(evtRequest)) return [3 /*break*/, 23];
                if (!main_1.activeModems.has(evtRequest.imei))
                    return [2 /*return*/, replyError("Dongle imei: " + evtRequest.imei + " not found")];
                modem = main_1.activeModems.get(evtRequest.imei).modem;
                name_2 = evtRequest.name, number = evtRequest.number;
                //TODO: validate params.
                if (!modem.storageLeft)
                    return [2 /*return*/, replyError("No storage space left on SIM")];
                return [4 /*yield*/, modem.createContact(number, name_2)];
            case 22:
                contact = _j.sent();
                amiClient.postUserEventAction(Response.CreateContact.buildAction(actionid, contact.index.toString(), contact.name, contact.number));
                return [3 /*break*/, 32];
            case 23:
                if (!Request.DeleteContact.matchEvt(evtRequest)) return [3 /*break*/, 25];
                if (!main_1.activeModems.has(evtRequest.imei))
                    return [2 /*return*/, replyError("Dongle imei: " + evtRequest.imei + " not found")];
                modem = main_1.activeModems.get(evtRequest.imei).modem;
                index = parseInt(evtRequest.index);
                if (!modem.getContact(index))
                    return [2 /*return*/, replyError("Contact index " + index + " does not exist")];
                return [4 /*yield*/, modem.deleteContact(index)];
            case 24:
                _j.sent();
                amiClient.postUserEventAction(Response.buildAction(Request.DeleteContact.keyword, actionid));
                return [3 /*break*/, 32];
            case 25:
                if (!Request.GetActiveDongles.matchEvt(evtRequest)) return [3 /*break*/, 31];
                return [4 /*yield*/, amiClient.postUserEventAction(Response.GetActiveDongles.Infos.buildAction(actionid, main_1.activeModems.size.toString())).promise];
            case 26:
                _j.sent();
                _g = 0, _h = main_1.activeModems.keysAsArray();
                _j.label = 27;
            case 27:
                if (!(_g < _h.length)) return [3 /*break*/, 30];
                imei = _h[_g];
                modem = main_1.activeModems.get(imei).modem;
                iccid = modem.iccid, imsi = modem.imsi, number = modem.number;
                return [4 /*yield*/, amiClient.postUserEventAction(Response.GetActiveDongles.Entry.buildAction(actionid, imei, iccid, imsi, number || "")).promise];
            case 28:
                _j.sent();
                _j.label = 29;
            case 29:
                _g++;
                return [3 /*break*/, 27];
            case 30: return [3 /*break*/, 32];
            case 31:
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
                    amiClient.postUserEventAction(Response.buildAction(Request.UnlockDongle.keyword, actionid));
                }
                else
                    return [2 /*return*/, replyError("Unknown command " + command)];
                _j.label = 32;
            case 32: return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=main.ami.js.map