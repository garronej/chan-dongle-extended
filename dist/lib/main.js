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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
require("rejection-tracker").main(__dirname, "..", "..");
//"postinstall": "if [ $(id -u) -eq 0  ]; then (node ./dist/bin/scripts postinstall); else (sudo node ./dist/bin/scripts postinstall); fi",
// lrwxrwxrwx 1 root pi 36 Apr 15 09:46 /usr/local/lib/node_modules/chan-dongle-extended -> /home/pi/github/chan-dongle-extended
var md5 = require("md5");
var ts_gsm_modem_1 = require("ts-gsm-modem");
var gsm_modem_connection_1 = require("gsm-modem-connection");
var ts_events_extended_1 = require("ts-events-extended");
var trackable_map_1 = require("trackable-map");
var runExclusive = require("run-exclusive");
var appStorage = require("./appStorage");
var _debug = require("debug");
var debug = _debug("_main");
function getDongleName(accessPoint) {
    var audioIfPath = accessPoint.audioIfPath;
    var match = audioIfPath.match(/^\/dev\/ttyUSB([0-9]+)$/);
    return "Dongle" + (match ? match[1] : md5(audioIfPath).substring(0, 6));
}
exports.getDongleName = getDongleName;
function storeSimPin(modem) {
    return __awaiter(this, void 0, void 0, function () {
        var appData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!modem.pin) return [3 /*break*/, 2];
                    debug("Persistent storing of pin: " + modem.pin);
                    if (modem.iccidAvailableBeforeUnlock)
                        debug("for SIM ICCID: " + modem.iccid);
                    else
                        debug([
                            "for dongle IMEI: " + modem.imei + ", because SIM ICCID ",
                            "is not readable with this dongle when SIM is locked"
                        ].join(""));
                    return [4 /*yield*/, appStorage.read()];
                case 1:
                    appData = _a.sent();
                    appData.pins[modem.iccidAvailableBeforeUnlock ? modem.iccid : modem.imei] = modem.pin;
                    appData.release();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
exports.storeSimPin = storeSimPin;
exports.lockedModems = new trackable_map_1.TrackableMap();
exports.activeModems = new trackable_map_1.TrackableMap();
if (process.env["NODE_ENV"] !== "production")
    require("./repl");
require("./evtLogger");
require("./main.ami");
require("./main.bridge");
debug("Daemon started!");
var onModemConnect = runExclusive.build(function (accessPoint) { return __awaiter(_this, void 0, void 0, function () {
    var _this = this;
    var evtDisconnect, _a, error, modem, hasSim;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (gsm_modem_connection_1.Monitor.connectedModems.indexOf(accessPoint) < 0 ||
                    exports.activeModems.has(accessPoint) ||
                    exports.lockedModems.has(accessPoint))
                    return [2 /*return*/];
                debug("CONNECT: " + accessPoint.toString());
                evtDisconnect = new ts_events_extended_1.VoidSyncEvent();
                return [4 /*yield*/, ts_gsm_modem_1.Modem.create({
                        "path": accessPoint.dataIfPath,
                        "unlockCodeProvider": function (imei, iccid, pinState, tryLeft, callback) {
                            gsm_modem_connection_1.Monitor.evtModemDisconnect.attachOnce(function (_a) {
                                var id = _a.id;
                                return id === accessPoint.id;
                            }, function () { return evtDisconnect.post(); });
                            exports.lockedModems.set(accessPoint, {
                                imei: imei,
                                iccid: iccid,
                                pinState: pinState,
                                tryLeft: tryLeft,
                                callback: callback,
                                evtDisconnect: evtDisconnect
                            });
                        }
                    })];
            case 1:
                _a = __read.apply(void 0, [_b.sent(), 3]), error = _a[0], modem = _a[1], hasSim = _a[2];
                if (error) {
                    debug("Initialization error, checking if unlock was successful...".red, error);
                    storeSimPin(modem);
                    evtDisconnect.post();
                    return [2 /*return*/];
                }
                if (!hasSim)
                    return [2 /*return*/, debug("No sim!".red)];
                exports.activeModems.set(accessPoint, modem);
                //TODO send periodical AT to keep alive while up
                modem.evtTerminate.attachOnce(function (error) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        debug("Modem evt terminate");
                        if (error)
                            debug("terminate reason: ", error);
                        exports.activeModems.delete(accessPoint);
                        return [2 /*return*/];
                    });
                }); });
                return [2 /*return*/];
        }
    });
}); });
gsm_modem_connection_1.Monitor.evtModemConnect.attach(onModemConnect);
gsm_modem_connection_1.Monitor.evtModemDisconnect.attach(function (accessPoint) { return debug("DISCONNECT: " + accessPoint.toString()); });
(function periodicalChecks() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, accessPoint, e_1, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!true) return [3 /*break*/, 2];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
                case 1:
                    _d.sent();
                    try {
                        for (_a = __values(gsm_modem_connection_1.Monitor.connectedModems), _b = _a.next(); !_b.done; _b = _a.next()) {
                            accessPoint = _b.value;
                            onModemConnect(accessPoint);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    return [3 /*break*/, 0];
                case 2: return [2 /*return*/];
            }
        });
    });
})();
