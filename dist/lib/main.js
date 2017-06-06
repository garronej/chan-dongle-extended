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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
require("rejection-tracker").main(__dirname, "..", "..");
var ts_gsm_modem_1 = require("ts-gsm-modem");
var gsm_modem_connection_1 = require("gsm-modem-connection");
var ts_events_extended_1 = require("ts-events-extended");
var trackable_map_1 = require("trackable-map");
var appStorage = require("./appStorage");
var _debug = require("debug");
var debug = _debug("_main");
exports.activeModems = new trackable_map_1.TrackableMap();
exports.lockedModems = new trackable_map_1.TrackableMap();
if (process.env["NODE_ENV"] !== "production")
    require("./repl");
require("./evtLogger");
require("./main.ami");
require("./main.bridge");
debug("Daemon started!");
gsm_modem_connection_1.Monitor.evtModemDisconnect.attach(function (accessPoint) { return debug("DISCONNECT: " + accessPoint.toString()); });
gsm_modem_connection_1.Monitor.evtModemConnect.attach(function (accessPoint) { return __awaiter(_this, void 0, void 0, function () {
    var _this = this;
    var evtDisconnect, _a, error, modem, hasSim, appData, dongleName;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                debug("CONNECT: " + accessPoint.toString());
                evtDisconnect = new ts_events_extended_1.VoidSyncEvent();
                return [4 /*yield*/, ts_gsm_modem_1.Modem.create({
                        "path": accessPoint.dataIfPath,
                        "unlockCodeProvider": function (imei, iccid, pinState, tryLeft, callback) {
                            gsm_modem_connection_1.Monitor.evtModemDisconnect.attachOnce(function (_a) {
                                var id = _a.id;
                                return id === accessPoint.id;
                            }, function () { return evtDisconnect.post(); });
                            exports.lockedModems.set(imei, {
                                iccid: iccid, pinState: pinState, tryLeft: tryLeft, callback: callback, evtDisconnect: evtDisconnect
                            });
                        }
                    })];
            case 1:
                _a = __read.apply(void 0, [_b.sent(), 3]), error = _a[0], modem = _a[1], hasSim = _a[2];
                if (!error) return [3 /*break*/, 4];
                debug("Initialization error".red, error);
                if (!modem.pin) return [3 /*break*/, 3];
                debug("Still unlock was successful so, Persistent storing of pin: " + modem.pin);
                if (modem.iccidAvailableBeforeUnlock)
                    debug("for SIM ICCID: " + modem.iccid);
                else
                    debug("for dongle IMEI: " + modem.imei + ", because SIM ICCID is not readable with this dongle when SIM is locked");
                return [4 /*yield*/, appStorage.read()];
            case 2:
                appData = _b.sent();
                appData.pins[modem.iccidAvailableBeforeUnlock ? modem.iccid : modem.imei] = modem.pin;
                appData.release();
                _b.label = 3;
            case 3:
                evtDisconnect.post();
                return [2 /*return*/];
            case 4:
                if (!hasSim)
                    return [2 /*return*/, debug("No sim!".red)];
                dongleName = "Dongle" + modem.imei.substring(0, 3) + modem.imei.substring(modem.imei.length - 3);
                exports.activeModems.set(modem.imei, { modem: modem, accessPoint: accessPoint, dongleName: dongleName });
                modem.evtTerminate.attachOnce(function (error) { return __awaiter(_this, void 0, void 0, function () {
                    var timeout_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                debug("Modem evt terminate");
                                if (error)
                                    debug("terminate reason: ", error);
                                exports.activeModems.delete(modem.imei);
                                if (!(gsm_modem_connection_1.Monitor.connectedModems.indexOf(accessPoint) >= 0)) return [3 /*break*/, 4];
                                debug("Modem still connected");
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, gsm_modem_connection_1.Monitor.evtModemDisconnect.waitFor(function (ac) { return ac === accessPoint; }, 5000)];
                            case 2:
                                _a.sent();
                                debug("Modem as really disconnected");
                                return [3 /*break*/, 4];
                            case 3:
                                timeout_1 = _a.sent();
                                debug("Modem still here, re-initializing");
                                gsm_modem_connection_1.Monitor.evtModemConnect.post(accessPoint);
                                return [3 /*break*/, 4];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=main.js.map