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
Object.defineProperty(exports, "__esModule", { value: true });
var AmiUserEvent_1 = require("../shared/AmiUserEvent");
var Response = AmiUserEvent_1.UserEvent.Response;
var Request = AmiUserEvent_1.UserEvent.Request;
var Event = AmiUserEvent_1.UserEvent.Event;
var AmiCredential_1 = require("../shared/AmiCredential");
var AstMan = require("asterisk-manager");
var ts_events_extended_1 = require("ts-events-extended");
exports.JSON_parse_WithDate = function (str) { return JSON.parse(str, function (_, value) {
    return (typeof value === "string" &&
        value.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)) ? new Date(value) : value;
}); };
process.on("unhandledRejection", function (error) {
    console.log("INTERNAL ERROR AMI CLIENT".red);
    console.log(error);
    throw error;
});
var AmiClient = (function () {
    function AmiClient(credential) {
        var _this = this;
        this.evtMessageStatusReport = new ts_events_extended_1.SyncEvent();
        this.evtDongleDisconnect = new ts_events_extended_1.SyncEvent();
        this.evtNewActiveDongle = new ts_events_extended_1.SyncEvent();
        this.evtRequestUnlockCode = new ts_events_extended_1.SyncEvent();
        this.evtNewMessage = new ts_events_extended_1.SyncEvent();
        this.evtAmiUserEvent = new ts_events_extended_1.SyncEvent();
        var port = credential.port, host = credential.host, user = credential.user, secret = credential.secret;
        this.ami = new AstMan(port, host, user, secret, true);
        this.ami.on("userevent", function (evt) { return _this.evtAmiUserEvent.post(evt); });
        this.registerListeners();
    }
    AmiClient.localhost = function () {
        if (this.localClient)
            return this.localClient;
        return this.localClient = new this(AmiCredential_1.AmiCredential.retrieve());
    };
    ;
    AmiClient.prototype.registerListeners = function () {
        var _this = this;
        this.evtAmiUserEvent.attach(Event.matchEvt, function (evt) {
            if (Event.MessageStatusReport.matchEvt(evt))
                _this.evtMessageStatusReport.post({
                    "imei": evt.imei,
                    "messageId": parseInt(evt.messageid),
                    "isDelivered": evt.isdelivered === "true",
                    "status": evt.status,
                    "dischargeTime": new Date(evt.dischargetime)
                });
            else if (Event.DongleDisconnect.matchEvt(evt))
                _this.evtDongleDisconnect.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "imsi": evt.imsi,
                    "number": evt.number || undefined
                });
            else if (Event.NewActiveDongle.matchEvt(evt))
                _this.evtNewActiveDongle.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "imsi": evt.imsi,
                    "number": evt.number || undefined
                });
            else if (Event.RequestUnlockCode.matchEvt(evt))
                _this.evtRequestUnlockCode.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "pinState": evt.pinstate,
                    "tryLeft": parseInt(evt.tryleft)
                });
            else if (Event.NewMessage.matchEvt(evt))
                _this.evtNewMessage.post({
                    "imei": evt.imei,
                    "number": evt.number,
                    "date": new Date(evt.date),
                    "text": AmiUserEvent_1.UserEvent.Event.NewMessage.reassembleText(evt)
                });
        });
    };
    AmiClient.prototype.postUserEventAction = function (actionEvt) {
        //return this.ami.action(actionEvt);
        var _this = this;
        var actionid = "";
        var promise = new Promise(function (resolve, reject) {
            actionid = _this.ami.actionExpectSingleResponse(actionEvt, function (error, res) {
                if (error)
                    reject(error);
                resolve();
            });
        });
        return { actionid: actionid, promise: promise };
    };
    AmiClient.prototype.disconnect = function () {
        this.ami.disconnect();
    };
    AmiClient.prototype.getLockedDongles = function (callback) {
        return __awaiter(this, void 0, void 0, function () {
            var actionid, evtResponse, dongleCount, out, evtResponse_1, imei, iccid, pinstate, tryleft;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        actionid = this.postUserEventAction(Request.GetLockedDongles.buildAction()).actionid;
                        return [4 /*yield*/, this.evtAmiUserEvent.waitFor(Response.GetLockedDongles.Infos.matchEvt(actionid), 10000)];
                    case 1:
                        evtResponse = _a.sent();
                        dongleCount = parseInt(evtResponse.donglecount);
                        out = [];
                        _a.label = 2;
                    case 2:
                        if (!(out.length !== dongleCount)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.evtAmiUserEvent.waitFor(Response.GetLockedDongles.Entry.matchEvt(actionid), 10000)];
                    case 3:
                        evtResponse_1 = _a.sent();
                        imei = evtResponse_1.imei, iccid = evtResponse_1.iccid, pinstate = evtResponse_1.pinstate, tryleft = evtResponse_1.tryleft;
                        out.push({
                            imei: imei,
                            iccid: iccid,
                            "pinState": pinstate,
                            "tryLeft": parseInt(tryleft)
                        });
                        return [3 /*break*/, 2];
                    case 4:
                        if (callback)
                            callback(out);
                        return [2 /*return*/, out];
                }
            });
        });
    };
    AmiClient.prototype.getActiveDongles = function (callback) {
        return __awaiter(this, void 0, void 0, function () {
            var actionid, evtResponse, dongleCount, out, evtResponse_2, imei, iccid, imsi, number;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        actionid = this.postUserEventAction(Request.GetActiveDongles.buildAction()).actionid;
                        return [4 /*yield*/, this.evtAmiUserEvent.waitFor(Response.GetActiveDongles.Infos.matchEvt(actionid), 10000)];
                    case 1:
                        evtResponse = _a.sent();
                        dongleCount = parseInt(evtResponse.donglecount);
                        out = [];
                        _a.label = 2;
                    case 2:
                        if (!(out.length !== dongleCount)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.evtAmiUserEvent.waitFor(Response.GetActiveDongles.Entry.matchEvt(actionid), 10000)];
                    case 3:
                        evtResponse_2 = _a.sent();
                        imei = evtResponse_2.imei, iccid = evtResponse_2.iccid, imsi = evtResponse_2.imsi, number = evtResponse_2.number;
                        out.push({ imei: imei, iccid: iccid, imsi: imsi, "number": number || undefined });
                        return [3 /*break*/, 2];
                    case 4:
                        if (callback)
                            callback(out);
                        return [2 /*return*/, out];
                }
            });
        });
    };
    AmiClient.prototype.sendMessage = function (imei, number, text, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var actionid, evtResponse, error, messageId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        actionid = this.postUserEventAction(Request.SendMessage.buildAction(imei, number, text)).actionid;
                        return [4 /*yield*/, this.evtAmiUserEvent.waitFor(Response.SendMessage.matchEvt(actionid), 10000)];
                    case 1:
                        evtResponse = _a.sent();
                        if (evtResponse.error) {
                            error = new Error(evtResponse.error);
                            messageId = NaN;
                        }
                        else {
                            error = null;
                            messageId = parseInt(evtResponse.messageid);
                        }
                        if (callback)
                            callback(error, messageId);
                        return [2 /*return*/, [error, messageId]];
                }
            });
        });
    };
    AmiClient.prototype.getSimPhonebook = function (imei, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var actionid, evt, error, infos, contactCount, contacts, evt_1, phonebook;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        actionid = this.postUserEventAction(Request.GetSimPhonebook.buildAction(imei)).actionid;
                        return [4 /*yield*/, this.evtAmiUserEvent.waitFor(Response.GetSimPhonebook.Infos.matchEvt(actionid), 10000)];
                    case 1:
                        evt = _a.sent();
                        if (evt.error) {
                            error = new Error(evt.error);
                            if (callback)
                                callback(error, null);
                            return [2 /*return*/, [error, null]];
                        }
                        infos = {
                            "contactNameMaxLength": parseInt(evt.contactnamemaxlength),
                            "numberMaxLength": parseInt(evt.numbermaxlength),
                            "storageLeft": parseInt(evt.storageleft)
                        };
                        contactCount = parseInt(evt.contactcount);
                        contacts = [];
                        _a.label = 2;
                    case 2:
                        if (!(contacts.length !== contactCount)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.evtAmiUserEvent.waitFor(Response.GetSimPhonebook.Entry.matchEvt(actionid), 10000)];
                    case 3:
                        evt_1 = _a.sent();
                        contacts.push({
                            "index": parseInt(evt_1.index),
                            "name": evt_1.name,
                            "number": evt_1.number
                        });
                        return [3 /*break*/, 2];
                    case 4:
                        phonebook = { infos: infos, contacts: contacts };
                        if (callback)
                            callback(null, phonebook);
                        return [2 /*return*/, [null, phonebook]];
                }
            });
        });
    };
    AmiClient.prototype.createContact = function (imei, name, number, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var actionid, evt, error, contact;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        actionid = this.postUserEventAction(Request.CreateContact.buildAction(imei, name, number)).actionid;
                        return [4 /*yield*/, this.evtAmiUserEvent.waitFor(Response.CreateContact.matchEvt(actionid), 10000)];
                    case 1:
                        evt = _a.sent();
                        if (evt.error) {
                            error = new Error(evt.error);
                            if (callback)
                                callback(error, null);
                            return [2 /*return*/, [error, null]];
                        }
                        contact = {
                            "index": parseInt(evt.index),
                            "name": evt.name,
                            "number": evt.number
                        };
                        if (callback)
                            callback(null, contact);
                        return [2 /*return*/, [null, contact]];
                }
            });
        });
    };
    AmiClient.prototype.getMessages = function (imei, flush, callback) {
        /*

        return new Promise<[null | Error, Message[] | null]>(resolve => {

            let ami = this.ami;

            let actionId = ami.action(
                UserEvent.Request.GetMessages.buildAction(
                    imei,
                    flush ? "true" : "false"
                )
            );

            ami.on("userevent", function callee(evt: UserEvent) {

                if (!UserEvent.Response.GetMessages.matchEvt(evt, actionId))
                    return;

                ami.removeListener("userevent", callee);


                let error: null | Error;
                let messages: Message[] | null;

                if (evt.error) {
                    error = new Error(evt.error);
                    messages = null;
                } else {
                    error = null;
                    messages = UserEvent.Response.GetMessages
                        .reassembleMessage(evt)
                        .map(value => JSON_parse_WithDate(value))
                        .sort(
                        (message1: Message, message2: Message) => message1.date.getTime() - message2.date.getTime()
                        );
                }


                if (callback) callback(error, messages);
                resolve([error, messages]);

            });

        });
        */
        return null;
    };
    AmiClient.prototype.deleteContact = function (imei, index, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var actionid, evt, error;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        actionid = this.postUserEventAction(Request.DeleteContact.buildAction(imei, index.toString())).actionid;
                        return [4 /*yield*/, this.evtAmiUserEvent.waitFor(Response.matchEvt(Request.DeleteContact.keyword, actionid), 10000)];
                    case 1:
                        evt = _a.sent();
                        error = evt.error ? new Error(evt.error) : null;
                        if (callback)
                            callback(error);
                        return [2 /*return*/, error];
                }
            });
        });
    };
    AmiClient.readUnlockParams = function (inputs) {
        var imei = inputs.shift();
        var callback = undefined;
        if (typeof inputs[inputs.length - 1] === "function")
            callback = inputs.pop();
        if (inputs.length === 1) {
            var pin = inputs[0];
            return { imei: imei, pin: pin, callback: callback };
        }
        else {
            var puk = inputs[0], newPin = inputs[1];
            return { imei: imei, puk: puk, newPin: newPin, callback: callback };
        }
    };
    AmiClient.prototype.unlockDongle = function () {
        var inputs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            inputs[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a, imei, pin, puk, newPin, callback, actionid, evt, error;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = AmiClient.readUnlockParams(inputs), imei = _a.imei, pin = _a.pin, puk = _a.puk, newPin = _a.newPin, callback = _a.callback;
                        if (pin)
                            actionid = this.postUserEventAction(Request.UnlockDongle.buildAction(imei, pin)).actionid;
                        else
                            actionid = this.postUserEventAction(Request.UnlockDongle.buildAction(imei, puk, newPin)).actionid;
                        return [4 /*yield*/, this.evtAmiUserEvent.waitFor(Response.matchEvt(Request.UnlockDongle.keyword, actionid), 10000)];
                    case 1:
                        evt = _b.sent();
                        error = evt.error ? new Error(evt.error) : null;
                        if (callback)
                            callback(error);
                        return [2 /*return*/, error];
                }
            });
        });
    };
    return AmiClient;
}());
AmiClient.localClient = undefined;
exports.AmiClient = AmiClient;
//# sourceMappingURL=AmiClient.js.map