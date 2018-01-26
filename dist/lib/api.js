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
var chan_dongle_extended_client_1 = require("../chan-dongle-extended-client");
var api = chan_dongle_extended_client_1._private.api;
var lt = require("./defs");
var matchModem = lt.matchModem;
var matchLockedModem = lt.matchLockedModem;
var chanDongleConfManager_1 = require("./chanDongleConfManager");
var trackable_map_1 = require("trackable-map");
var storage = require("./appStorage");
var _debug = require("debug");
var debug = _debug("_api");
var upSince = Date.now();
function start(modems, ami) {
    var _this = this;
    var server = chan_dongle_extended_client_1.Ami.getInstance().createApiServer(chan_dongle_extended_client_1.DongleController.apiId);
    (function () { return __awaiter(_this, void 0, void 0, function () {
        var eventData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    eventData = { upSince: upSince };
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 3];
                    server.postEvent(api.Events.periodicalSignal.name, eventData);
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(function () { return resolve(); }, api.Events.periodicalSignal.interval); })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/];
            }
        });
    }); })();
    modems.evt.attach(function (_a) {
        var _b = __read(_a, 3), newModem = _b[0], _ = _b[1], oldModem = _b[2];
        debug("Dongle", JSON.stringify(buildDongle(newModem), null, 2));
        var dongleImei;
        if (trackable_map_1.isVoid(newModem)) {
            if (trackable_map_1.isVoid(oldModem))
                throw "cast";
            dongleImei = oldModem.imei;
        }
        else {
            if (!trackable_map_1.isVoid(oldModem))
                throw "cast";
            dongleImei = newModem.imei;
        }
        var eventData = {
            dongleImei: dongleImei,
            "dongle": buildDongle(newModem)
        };
        server.postEvent(api.Events.updateMap.name, eventData);
        if (!matchModem(newModem))
            return;
        var imsi = newModem.imsi;
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
        newModem.evtMessage.attach(function (message) { return __awaiter(_this, void 0, void 0, function () {
            var appData, eventData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, storage.read()];
                    case 1:
                        appData = _a.sent();
                        appData.messages[imsi].push(message);
                        eventData = { dongleImei: dongleImei, message: message };
                        server.postEvent(api.Events.message.name, eventData);
                        return [2 /*return*/];
                }
            });
        }); });
        newModem.evtMessageStatusReport.attach(function (statusReport) {
            var eventData = { dongleImei: dongleImei, statusReport: statusReport };
            server.postEvent(api.Events.statusReport.name, eventData);
        });
    });
    server.evtRequest.attach(function (_a) {
        var method = _a.method, params = _a.params, resolve = _a.resolve, reject = _a.reject;
        return __awaiter(_this, void 0, void 0, function () {
            var _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = resolve;
                        return [4 /*yield*/, handlers[method](params)];
                    case 1:
                        _a.apply(void 0, [_b.sent()]);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _b.sent();
                        reject(error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    });
    var moduleConfiguration = (function () {
        var _a = chanDongleConfManager_1.chanDongleConfManager.getConfig(), general = _a.general, defaults = _a.defaults;
        return { general: general, defaults: defaults };
    })();
    var handlers = {};
    handlers[api.sendMessage.method] =
        function (params) { return __awaiter(_this, void 0, void 0, function () {
            var viaDongleImei, toNumber, text, modem, sendDate, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        viaDongleImei = params.viaDongleImei, toNumber = params.toNumber, text = params.text;
                        modem = modems.find(function (modem) { return modem.imei === viaDongleImei; });
                        if (!matchModem(modem)) {
                            throw new Error("Dongle not available");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, Promise.race([
                                modem.sendMessage(toNumber, text),
                                new Promise(function (_, reject) { return modem.evtTerminate.attachOnce(params, reject); })
                            ])];
                    case 2:
                        sendDate = _a.sent();
                        modem.evtTerminate.detach(params);
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        return [2 /*return*/, { "success": false, "reason": "DISCONNECT" }];
                    case 4:
                        if (sendDate === undefined) {
                            return [2 /*return*/, { "success": false, "reason": "CANNOT SEND" }];
                        }
                        return [2 /*return*/, { "success": true, sendDate: sendDate }];
                }
            });
        }); };
    handlers[api.initialize.method] =
        function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        "dongles": modems.valuesAsArray().map(function (modem) { return buildDongle(modem); }),
                        moduleConfiguration: moduleConfiguration
                    }];
            });
        }); };
    handlers[api.unlock.method] =
        function (params) {
            var dongleImei = params.dongleImei;
            var lockedModem = modems.find(function (_a) {
                var imei = _a.imei;
                return dongleImei === imei;
            });
            if (!matchLockedModem(lockedModem)) {
                throw new Error("No such dongle to unlock");
            }
            if (api.unlock.matchPin(params)) {
                return lockedModem.performUnlock(params.pin);
            }
            else {
                return lockedModem.performUnlock(params.puk, params.newPin);
            }
        };
    handlers[api.getMessages.method] =
        function (params) { return __awaiter(_this, void 0, void 0, function () {
            var response, matchImsi, from, to, flush, appData, _a, _b, imsi, messagesOfSim, _c, _d, message, time, e_1, _e, e_2, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        response = {};
                        matchImsi = function (imsi) { return true; };
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
                                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                                finally {
                                    try {
                                        if (_d && !_d.done && (_f = _c.return)) _f.call(_c);
                                    }
                                    finally { if (e_2) throw e_2.error; }
                                }
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (_b && !_b.done && (_e = _a.return)) _e.call(_a);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        return [2 /*return*/, response];
                }
            });
        }); };
}
exports.start = start;
function buildDongle(modem) {
    if (matchLockedModem(modem)) {
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
    else if (matchModem(modem)) {
        return (function buildActiveDongle(modem) {
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
                            "localFormat": chan_dongle_extended_client_1.phoneNumberLibrary.toNationalNumber(contact.number, imsi)
                        }
                    });
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_3) throw e_3.error; }
            }
            var digest = chan_dongle_extended_client_1.DongleController.SimStorage.computeDigest(number, storageLeft, contacts);
            return {
                "imei": modem.imei,
                "manufacturer": modem.manufacturer,
                "model": modem.model,
                "firmwareVersion": modem.firmwareVersion,
                "isVoiceEnabled": modem.isVoiceEnabled,
                "sim": {
                    "iccid": modem.iccid,
                    imsi: imsi,
                    "serviceProvider": {
                        "fromImsi": (function () {
                            var imsiInfos = chan_dongle_extended_client_1.phoneNumberLibrary.getImsiInfos(imsi);
                            return imsiInfos ? imsiInfos.network_name : undefined;
                        })(),
                        "fromNetwork": modem.serviceProviderName
                    },
                    "storage": {
                        number: number,
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
            var e_3, _c;
        })(modem);
    }
    else {
        return undefined;
    }
}
