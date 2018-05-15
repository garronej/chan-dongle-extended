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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var types = require("./types");
var InstallOptions_1 = require("./InstallOptions");
var chan_dongle_extended_client_1 = require("../chan-dongle-extended-client");
var localApiDeclaration = chan_dongle_extended_client_1.apiDeclaration.service;
var remoteApiDeclaration = chan_dongle_extended_client_1.apiDeclaration.controller;
var trackable_map_1 = require("trackable-map");
var storage = require("./appStorage");
var sipLibrary = require("ts-sip");
var ts_events_extended_1 = require("ts-events-extended");
var logger_1 = require("./logger");
var net = require("net");
var sockets = new Set();
function launch(modems, staticModuleConfiguration) {
    var _this = this;
    var _a = InstallOptions_1.InstallOptions.get(), bind_addr = _a.bind_addr, port = _a.port;
    var server = new sipLibrary.api.Server(makeApiHandlers(modems), sipLibrary.api.Server.getDefaultLogger({
        log: logger_1.log,
        "displayOnlyErrors": false,
        "hideKeepAlive": true
    }));
    var evtListening = new ts_events_extended_1.VoidSyncEvent();
    net.createServer()
        .once("error", function (error) { throw error; })
        .on("connection", function (netSocket) { return __awaiter(_this, void 0, void 0, function () {
        var socket;
        return __generator(this, function (_a) {
            socket = new sipLibrary.Socket(netSocket);
            server.startListening(socket);
            sockets.add(socket);
            socket.evtClose.attachOnce(function () { return sockets.delete(socket); });
            (function () {
                var methodName = remoteApiDeclaration.notifyCurrentState.methodName;
                sipLibrary.api.client.sendRequest(socket, methodName, {
                    "dongles": Array.from(modems.values()).map(function (modem) { return buildDongle(modem); }),
                    staticModuleConfiguration: staticModuleConfiguration
                }).catch(function () { });
            })();
            return [2 /*return*/];
        });
    }); })
        .once("listening", function () { return evtListening.post(); })
        .listen(port, bind_addr);
    modems.evt.attach(function (_a) {
        var _b = __read(_a, 3), newModem = _b[0], _ = _b[1], oldModem = _b[2];
        var dongleImei = (function () {
            if (trackable_map_1.isVoid(newModem)) {
                if (trackable_map_1.isVoid(oldModem))
                    throw "( never )";
                return oldModem.imei;
            }
            else {
                if (!trackable_map_1.isVoid(oldModem))
                    throw "( never )";
                return newModem.imei;
            }
        })();
        (function () {
            var methodName = remoteApiDeclaration.updateMap.methodName;
            broadcastRequest(methodName, {
                dongleImei: dongleImei,
                "dongle": buildDongle(newModem)
            });
        })();
        if (types.matchModem(newModem)) {
            onNewModem(newModem);
        }
    });
    return new Promise(function (resolve) { return evtListening.attachOnce(function () { return resolve(); }); });
}
exports.launch = launch;
function broadcastRequest(methodName, params) {
    try {
        for (var sockets_1 = __values(sockets), sockets_1_1 = sockets_1.next(); !sockets_1_1.done; sockets_1_1 = sockets_1.next()) {
            var socket = sockets_1_1.value;
            sipLibrary.api.client.sendRequest(socket, methodName, params).catch(function () { });
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (sockets_1_1 && !sockets_1_1.done && (_a = sockets_1.return)) _a.call(sockets_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var e_1, _a;
}
function onNewModem(modem) {
    var _this = this;
    var imsi = modem.imsi;
    (function () { return __awaiter(_this, void 0, void 0, function () {
        var appData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.read()];
                case 1:
                    appData = _a.sent();
                    if (!appData.messages[imsi]) {
                        appData.messages[imsi] = [];
                    }
                    return [2 /*return*/];
            }
        });
    }); })();
    var dongleImei = modem.imei;
    modem.evtMessage.attach(function (message) { return __awaiter(_this, void 0, void 0, function () {
        var _this = this;
        var methodName, response, appData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    methodName = remoteApiDeclaration.notifyMessage.methodName;
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var tasks = [];
                            var _loop_1 = function (socket) {
                                tasks[tasks.length] = (function () { return __awaiter(_this, void 0, void 0, function () {
                                    var response, _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                response = "DO NOT SAVE MESSAGE";
                                                _b.label = 1;
                                            case 1:
                                                _b.trys.push([1, 3, , 4]);
                                                return [4 /*yield*/, sipLibrary.api.client.sendRequest(socket, methodName, { dongleImei: dongleImei, message: message })];
                                            case 2:
                                                response = _b.sent();
                                                return [3 /*break*/, 4];
                                            case 3:
                                                _a = _b.sent();
                                                return [3 /*break*/, 4];
                                            case 4:
                                                if (response === "SAVE MESSAGE") {
                                                    resolve(response);
                                                }
                                                return [2 /*return*/];
                                        }
                                    });
                                }); })();
                            };
                            try {
                                for (var sockets_2 = __values(sockets), sockets_2_1 = sockets_2.next(); !sockets_2_1.done; sockets_2_1 = sockets_2.next()) {
                                    var socket = sockets_2_1.value;
                                    _loop_1(socket);
                                }
                            }
                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                            finally {
                                try {
                                    if (sockets_2_1 && !sockets_2_1.done && (_a = sockets_2.return)) _a.call(sockets_2);
                                }
                                finally { if (e_2) throw e_2.error; }
                            }
                            Promise.all(tasks).then(function () { return resolve("DO NOT SAVE MESSAGE"); });
                            var e_2, _a;
                        })];
                case 1:
                    response = _a.sent();
                    if (!(response === "SAVE MESSAGE")) return [3 /*break*/, 3];
                    return [4 /*yield*/, storage.read()];
                case 2:
                    appData = _a.sent();
                    appData.messages[imsi].push(message);
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); });
    modem.evtMessageStatusReport.attach(function (statusReport) {
        var methodName = remoteApiDeclaration.notifyStatusReport.methodName;
        broadcastRequest(methodName, { dongleImei: dongleImei, statusReport: statusReport });
    });
}
function makeApiHandlers(modems) {
    var _this = this;
    var handlers = {};
    (function () {
        var methodName = localApiDeclaration.sendMessage.methodName;
        var handler = {
            "handler": function (_a) {
                var viaDongleImei = _a.viaDongleImei, toNumber = _a.toNumber, text = _a.text;
                return __awaiter(_this, void 0, void 0, function () {
                    var modem, sendDate, boundTo_1, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                modem = modems.find(function (_a) {
                                    var imei = _a.imei;
                                    return imei === viaDongleImei;
                                });
                                if (!types.matchModem(modem)) {
                                    return [2 /*return*/, { "success": false, "reason": "DISCONNECT" }];
                                }
                                _c.label = 1;
                            case 1:
                                _c.trys.push([1, 3, , 4]);
                                boundTo_1 = [];
                                return [4 /*yield*/, Promise.race([
                                        modem.sendMessage(toNumber, text),
                                        new Promise(function (_, reject) { return modem.evtTerminate.attachOnce(boundTo_1, function () { return reject(); }); })
                                    ])];
                            case 2:
                                sendDate = _c.sent();
                                modem.evtTerminate.detach(boundTo_1);
                                return [3 /*break*/, 4];
                            case 3:
                                _b = _c.sent();
                                return [2 /*return*/, { "success": false, "reason": "DISCONNECT" }];
                            case 4:
                                if (sendDate === undefined) {
                                    return [2 /*return*/, { "success": false, "reason": "CANNOT SEND" }];
                                }
                                return [2 /*return*/, { "success": true, sendDate: sendDate }];
                        }
                    });
                });
            }
        };
        handlers[methodName] = handler;
    })();
    (function () {
        var methodName = localApiDeclaration.unlock.methodName;
        var handler = {
            "handler": function (params) { return __awaiter(_this, void 0, void 0, function () {
                var dongleImei, lockedModem, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            dongleImei = params.dongleImei;
                            lockedModem = modems.find(function (_a) {
                                var imei = _a.imei;
                                return dongleImei === imei;
                            });
                            if (!types.LockedModem.match(lockedModem)) {
                                return [2 /*return*/, undefined];
                            }
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 6, , 7]);
                            if (!localApiDeclaration.unlock.matchPin(params)) return [3 /*break*/, 3];
                            return [4 /*yield*/, lockedModem.performUnlock(params.pin)];
                        case 2: return [2 /*return*/, _b.sent()];
                        case 3: return [4 /*yield*/, lockedModem.performUnlock(params.puk, params.newPin)];
                        case 4: return [2 /*return*/, _b.sent()];
                        case 5: return [3 /*break*/, 7];
                        case 6:
                            _a = _b.sent();
                            return [2 /*return*/, undefined];
                        case 7: return [2 /*return*/];
                    }
                });
            }); }
        };
        handlers[methodName] = handler;
    })();
    (function () {
        var methodName = localApiDeclaration.getMessages.methodName;
        var handler = {
            "handler": function (params) { return __awaiter(_this, void 0, void 0, function () {
                var response, from, to, flush, appData, _a, _b, imsi, messagesOfSim, _c, _d, message, time, e_3, _e, e_4, _f;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0:
                            response = {};
                            from = 0;
                            to = Infinity;
                            flush = false;
                            if (params.fromDate !== undefined) {
                                from = params.fromDate.getTime();
                            }
                            if (params.toDate !== undefined) {
                                to = params.toDate.getTime();
                            }
                            if (params.flush !== undefined) {
                                flush = params.flush;
                            }
                            return [4 /*yield*/, storage.read()];
                        case 1:
                            appData = _g.sent();
                            try {
                                for (_a = __values(params.imsi ? [params.imsi] : Object.keys(appData.messages)), _b = _a.next(); !_b.done; _b = _a.next()) {
                                    imsi = _b.value;
                                    messagesOfSim = appData.messages[imsi];
                                    if (!messagesOfSim) {
                                        throw new Error("Sim imsi: " + imsi + " was never connected");
                                    }
                                    response[imsi] = [];
                                    try {
                                        for (_c = __values(__spread(messagesOfSim)), _d = _c.next(); !_d.done; _d = _c.next()) {
                                            message = _d.value;
                                            time = message.date.getTime();
                                            if ((time < from) || (time > to))
                                                continue;
                                            response[imsi].push(message);
                                            if (flush) {
                                                messagesOfSim.splice(messagesOfSim.indexOf(message), 1);
                                            }
                                        }
                                    }
                                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                                    finally {
                                        try {
                                            if (_d && !_d.done && (_f = _c.return)) _f.call(_c);
                                        }
                                        finally { if (e_4) throw e_4.error; }
                                    }
                                }
                            }
                            catch (e_3_1) { e_3 = { error: e_3_1 }; }
                            finally {
                                try {
                                    if (_b && !_b.done && (_e = _a.return)) _e.call(_a);
                                }
                                finally { if (e_3) throw e_3.error; }
                            }
                            return [2 /*return*/, response];
                    }
                });
            }); }
        };
        handlers[methodName] = handler;
    })();
    return handlers;
}
function buildDongle(modem) {
    if (types.LockedModem.match(modem)) {
        return (function buildLockedDongle(lockedModem) {
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
    }
    else if (types.matchModem(modem)) {
        return (function buildUsableDongle(modem) {
            var number = modem.number;
            var storageLeft = modem.storageLeft;
            var contacts = [];
            var imsi = modem.imsi;
            try {
                for (var _a = __values(modem.contacts), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var contact = _b.value;
                    contacts.push({
                        "index": contact.index,
                        "name": {
                            "asStored": contact.name,
                            "full": contact.name
                        },
                        "number": {
                            "asStored": contact.number,
                            "localFormat": chan_dongle_extended_client_1.misc.toNationalNumber(contact.number, imsi)
                        }
                    });
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_5) throw e_5.error; }
            }
            var digest = chan_dongle_extended_client_1.misc.computeSimStorageDigest(number, storageLeft, contacts);
            var simCountryAndSp = chan_dongle_extended_client_1.misc.getSimCountryAndSp(imsi);
            return {
                "imei": modem.imei,
                "manufacturer": modem.manufacturer,
                "model": modem.model,
                "firmwareVersion": modem.firmwareVersion,
                "isVoiceEnabled": modem.isVoiceEnabled,
                "sim": {
                    "iccid": modem.iccid,
                    imsi: imsi,
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
                            ({ "asStored": number, "localFormat": chan_dongle_extended_client_1.misc.toNationalNumber(number, imsi) })
                            : undefined,
                        "infos": {
                            "contactNameMaxLength": modem.contactNameMaxLength,
                            "numberMaxLength": modem.numberMaxLength,
                            storageLeft: storageLeft
                        },
                        contacts: contacts,
                        digest: digest
                    }
                }
            };
            var e_5, _c;
        })(modem);
    }
    else {
        return undefined;
    }
}
