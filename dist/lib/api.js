"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
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
Object.defineProperty(exports, "__esModule", { value: true });
var types = require("./types");
var InstallOptions_1 = require("./InstallOptions");
var logger = require("logger");
var chan_dongle_extended_client_1 = require("../chan-dongle-extended-client");
var localApiDeclaration = chan_dongle_extended_client_1.apiDeclaration.service;
var remoteApiDeclaration = chan_dongle_extended_client_1.apiDeclaration.controller;
var trackable_map_1 = require("trackable-map");
var sipLibrary = require("ts-sip");
var ts_evt_1 = require("ts-evt");
var db = require("./db");
var net = require("net");
var debug = logger.debugFactory();
var sockets = new Set();
function beforeExit() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, beforeExit.impl()];
        });
    });
}
exports.beforeExit = beforeExit;
(function (beforeExit) {
    beforeExit.impl = function () { return Promise.resolve(); };
})(beforeExit = exports.beforeExit || (exports.beforeExit = {}));
function launch(modems, staticModuleConfiguration) {
    var _this = this;
    var _a = InstallOptions_1.InstallOptions.get(), bind_addr = _a.bind_addr, port = _a.port;
    var server = new sipLibrary.api.Server(makeApiHandlers(modems), sipLibrary.api.Server.getDefaultLogger({
        "log": logger.log,
        "displayOnlyErrors": false,
        "hideKeepAlive": true
    }));
    var evtListening = new ts_evt_1.VoidEvt();
    var netServer = net.createServer();
    netServer
        .once("error", function (error) { throw error; })
        .on("connection", function (netSocket) { return __awaiter(_this, void 0, void 0, function () {
        var socket;
        return __generator(this, function (_a) {
            socket = new sipLibrary.Socket(netSocket, true);
            server.startListening(socket);
            sockets.add(socket);
            socket.evtClose.attachOnce(function () { return sockets.delete(socket); });
            (function () {
                var methodName = remoteApiDeclaration.notifyCurrentState.methodName;
                sipLibrary.api.client.sendRequest(socket, methodName, {
                    "dongles": Array.from(modems.values()).map(function (modem) { return buildDongleFromModem(modem); }),
                    staticModuleConfiguration: staticModuleConfiguration
                }).catch(function () { });
            })();
            return [2 /*return*/];
        });
    }); })
        .once("listening", function () {
        beforeExit.impl = function () { return new Promise(function (resolve) {
            var e_1, _a;
            netServer.close(function () {
                debug("Terminated!");
                resolve();
            });
            try {
                for (var _b = __values(sockets.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var socket = _c.value;
                    socket.destroy();
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }); };
        evtListening.post();
    })
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
        {
            var methodName = remoteApiDeclaration.updateMap.methodName;
            broadcastRequest(methodName, {
                dongleImei: dongleImei,
                "dongle": buildDongleFromModem(newModem)
            });
        }
        if (types.matchModem(newModem)) {
            onNewModem(newModem);
        }
    });
    return new Promise(function (resolve) { return evtListening.attachOnce(function () { return resolve(); }); });
}
exports.launch = launch;
function broadcastRequest(methodName, params) {
    var e_2, _a;
    try {
        for (var sockets_1 = __values(sockets), sockets_1_1 = sockets_1.next(); !sockets_1_1.done; sockets_1_1 = sockets_1.next()) {
            var socket = sockets_1_1.value;
            sipLibrary.api.client.sendRequest(socket, methodName, params).catch(function () { });
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (sockets_1_1 && !sockets_1_1.done && (_a = sockets_1.return)) _a.call(sockets_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
}
function onNewModem(modem) {
    var _this = this;
    var dongleImei = modem.imei;
    modem.evtGsmConnectivityChange.attach(function () {
        var e_3, _a;
        var methodName = remoteApiDeclaration.notifyGsmConnectivityChange.methodName;
        try {
            for (var sockets_2 = __values(sockets), sockets_2_1 = sockets_2.next(); !sockets_2_1.done; sockets_2_1 = sockets_2.next()) {
                var socket = sockets_2_1.value;
                sipLibrary.api.client.sendRequest(socket, methodName, { dongleImei: dongleImei }).catch(function () { });
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (sockets_2_1 && !sockets_2_1.done && (_a = sockets_2.return)) _a.call(sockets_2);
            }
            finally { if (e_3) throw e_3.error; }
        }
    });
    modem.evtCellSignalStrengthTierChange.attach(function () {
        var e_4, _a;
        var methodName = remoteApiDeclaration.notifyCellSignalStrengthChange.methodName;
        try {
            for (var sockets_3 = __values(sockets), sockets_3_1 = sockets_3.next(); !sockets_3_1.done; sockets_3_1 = sockets_3.next()) {
                var socket = sockets_3_1.value;
                sipLibrary.api.client.sendRequest(socket, methodName, {
                    dongleImei: dongleImei,
                    "cellSignalStrength": buildDongleFromModem.modemCellSignalStrengthTierToDongleCellSignalStrength(modem.getCurrentGsmConnectivityState().cellSignalStrength.tier)
                }).catch(function () { });
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (sockets_3_1 && !sockets_3_1.done && (_a = sockets_3.return)) _a.call(sockets_3);
            }
            finally { if (e_4) throw e_4.error; }
        }
    });
    modem.evtMessage.attach(function (message) { return __awaiter(_this, void 0, void 0, function () {
        var methodName, response;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    methodName = remoteApiDeclaration.notifyMessage.methodName;
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var e_5, _a;
                            var tasks = [];
                            var _loop_1 = function (socket) {
                                tasks[tasks.length] = (function () { return __awaiter(_this, void 0, void 0, function () {
                                    var response_1, _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                _b.trys.push([0, 2, , 3]);
                                                return [4 /*yield*/, sipLibrary.api.client.sendRequest(socket, methodName, { dongleImei: dongleImei, message: message })];
                                            case 1:
                                                response_1 = _b.sent();
                                                if (response_1 === "DO NOT SAVE MESSAGE") {
                                                    resolve(response_1);
                                                }
                                                return [3 /*break*/, 3];
                                            case 2:
                                                _a = _b.sent();
                                                return [3 /*break*/, 3];
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                }); })();
                            };
                            try {
                                for (var sockets_4 = __values(sockets), sockets_4_1 = sockets_4.next(); !sockets_4_1.done; sockets_4_1 = sockets_4.next()) {
                                    var socket = sockets_4_1.value;
                                    _loop_1(socket);
                                }
                            }
                            catch (e_5_1) { e_5 = { error: e_5_1 }; }
                            finally {
                                try {
                                    if (sockets_4_1 && !sockets_4_1.done && (_a = sockets_4.return)) _a.call(sockets_4);
                                }
                                finally { if (e_5) throw e_5.error; }
                            }
                            Promise.all(tasks).then(function () { return resolve("SAVE MESSAGE"); });
                        })];
                case 1:
                    response = _a.sent();
                    if (!(response === "SAVE MESSAGE")) return [3 /*break*/, 3];
                    return [4 /*yield*/, db.messages.save(modem.imsi, message)];
                case 2:
                    _a.sent();
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
    {
        var methodName = localApiDeclaration.sendMessage.methodName;
        var handler = {
            "handler": function (_a) {
                var viaDongleImei = _a.viaDongleImei, toNumber = _a.toNumber, text = _a.text;
                return __awaiter(_this, void 0, void 0, function () {
                    var modem, sendDate, _b;
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
                                return [4 /*yield*/, performModemAction(modem, function () { return modem.sendMessage(toNumber, text); })];
                            case 2:
                                sendDate = _c.sent();
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
    }
    {
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
    }
    {
        var methodName = localApiDeclaration.rebootDongle.methodName;
        var handler = {
            "handler": function (_a) {
                var imei = _a.imei;
                return __awaiter(_this, void 0, void 0, function () {
                    var modem;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                modem = Array.from(modems.values())
                                    .find(function (modem) { return modem.imei === imei; });
                                if (!modem) {
                                    return [2 /*return*/, undefined];
                                }
                                modem["__api_rebootDongle_called__"] = true;
                                return [4 /*yield*/, modem.terminate()];
                            case 1:
                                _b.sent();
                                return [2 /*return*/, undefined];
                        }
                    });
                });
            }
        };
        handlers[methodName] = handler;
    }
    {
        var methodName = localApiDeclaration.getMessages.methodName;
        var handler = {
            "handler": function (params) { return db.messages.retrieve(params); }
        };
        handlers[methodName] = handler;
    }
    {
        var methodName = localApiDeclaration.createContact.methodName;
        var handler = {
            "handler": function (_a) {
                var imsi = _a.imsi, number = _a.number, name = _a.name;
                return __awaiter(_this, void 0, void 0, function () {
                    var modem, contact, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                modem = Array.from(modems.values())
                                    .filter(types.matchModem)
                                    .find(function (modem) { return modem.imsi === imsi; });
                                if (!modem) {
                                    return [2 /*return*/, { "isSuccess": false }];
                                }
                                _c.label = 1;
                            case 1:
                                _c.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, performModemAction(modem, function () { return modem.createContact(number, name); })];
                            case 2:
                                contact = _c.sent();
                                return [3 /*break*/, 4];
                            case 3:
                                _b = _c.sent();
                                return [2 /*return*/, { "isSuccess": false }];
                            case 4: return [2 /*return*/, { "isSuccess": true, contact: contact }];
                        }
                    });
                });
            }
        };
        handlers[methodName] = handler;
    }
    {
        var methodName = localApiDeclaration.updateContact.methodName;
        var handler = {
            "handler": function (_a) {
                var imsi = _a.imsi, index = _a.index, new_number = _a.new_number, new_name = _a.new_name;
                return __awaiter(_this, void 0, void 0, function () {
                    var modem, contact, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                modem = Array.from(modems.values())
                                    .filter(types.matchModem)
                                    .find(function (modem) { return modem.imsi === imsi; });
                                if (!modem) {
                                    return [2 /*return*/, { "isSuccess": false }];
                                }
                                _c.label = 1;
                            case 1:
                                _c.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, performModemAction(modem, function () { return modem.updateContact(index, { "name": new_name, "number": new_number }); })];
                            case 2:
                                contact = _c.sent();
                                return [3 /*break*/, 4];
                            case 3:
                                _b = _c.sent();
                                return [2 /*return*/, { "isSuccess": false }];
                            case 4: return [2 /*return*/, { "isSuccess": true, contact: contact }];
                        }
                    });
                });
            }
        };
        handlers[methodName] = handler;
    }
    {
        var methodName = localApiDeclaration.deleteContact.methodName;
        var handler = {
            "handler": function (_a) {
                var imsi = _a.imsi, index = _a.index;
                return __awaiter(_this, void 0, void 0, function () {
                    var modem, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                modem = Array.from(modems.values())
                                    .filter(types.matchModem)
                                    .find(function (modem) { return modem.imsi === imsi; });
                                if (!modem) {
                                    return [2 /*return*/, { "isSuccess": false }];
                                }
                                _c.label = 1;
                            case 1:
                                _c.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, performModemAction(modem, function () { return modem.deleteContact(index); })];
                            case 2:
                                _c.sent();
                                return [3 /*break*/, 4];
                            case 3:
                                _b = _c.sent();
                                return [2 /*return*/, { "isSuccess": false }];
                            case 4: return [2 /*return*/, { "isSuccess": true }];
                        }
                    });
                });
            }
        };
        handlers[methodName] = handler;
    }
    return handlers;
}
/**
 * Perform an action on modem, throw if the Modem disconnect
 * before the action is completed.
 * */
function performModemAction(modem, action) {
    return __awaiter(this, void 0, void 0, function () {
        var boundTo, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    boundTo = [];
                    return [4 /*yield*/, Promise.race([
                            action(),
                            new Promise(function (_, reject) { return modem.evtTerminate.attachOnce(boundTo, function () { return reject(new Error("Modem disconnect while performing action")); }); })
                        ])];
                case 1:
                    response = _a.sent();
                    modem.evtTerminate.detach(boundTo);
                    return [2 /*return*/, response];
            }
        });
    });
}
function buildDongleFromModem(modem) {
    if (types.LockedModem.match(modem)) {
        return buildDongleFromModem.buildLockedDongleFromLockedModem(modem);
    }
    else if (types.matchModem(modem)) {
        return buildDongleFromModem.buildUsableDongleFromModem(modem);
    }
    else {
        return undefined;
    }
}
(function (buildDongleFromModem) {
    function buildLockedDongleFromLockedModem(lockedModem) {
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
    buildDongleFromModem.buildLockedDongleFromLockedModem = buildLockedDongleFromLockedModem;
    function buildUsableDongleFromModem(modem) {
        var number = modem.number;
        var storageLeft = modem.storageLeft;
        var contacts = modem.contacts;
        var imsi = modem.imsi;
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
                    "number": number || undefined,
                    "infos": {
                        "contactNameMaxLength": modem.contactNameMaxLength,
                        "numberMaxLength": modem.numberMaxLength,
                        storageLeft: storageLeft
                    },
                    contacts: contacts,
                    digest: digest
                }
            },
            "cellSignalStrength": modemCellSignalStrengthTierToDongleCellSignalStrength(modem.getCurrentGsmConnectivityState().cellSignalStrength.tier),
            "isGsmConnectivityOk": modem.isGsmConnectivityOk()
        };
    }
    buildDongleFromModem.buildUsableDongleFromModem = buildUsableDongleFromModem;
    function modemCellSignalStrengthTierToDongleCellSignalStrength(tier) {
        switch (tier) {
            case "<=-113 dBm": return "VERY WEAK";
            case "-111 dBm": return "WEAK";
            case "–109 dBm to –53 dBm": return "GOOD";
            case "≥ –51 dBm": return "EXCELLENT";
            case "Unknown or undetectable": return "NULL";
        }
    }
    buildDongleFromModem.modemCellSignalStrengthTierToDongleCellSignalStrength = modemCellSignalStrengthTierToDongleCellSignalStrength;
})(buildDongleFromModem || (buildDongleFromModem = {}));
