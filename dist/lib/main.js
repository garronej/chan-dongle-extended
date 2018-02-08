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
Object.defineProperty(exports, "__esModule", { value: true });
require("rejection-tracker").main(__dirname, "..", "..");
//"postinstall": "if [ $(id -u) -eq 0  ]; then (node ./dist/bin/scripts postinstall); else (sudo node ./dist/bin/scripts postinstall); fi",
// lrwxrwxrwx 1 root pi 36 Apr 15 09:46 /usr/local/lib/node_modules/chan-dongle-extended -> /home/pi/github/chan-dongle-extended
var ts_gsm_modem_1 = require("ts-gsm-modem");
var trackable_map_1 = require("trackable-map");
var storage = require("./appStorage");
var chan_dongle_extended_client_1 = require("../chan-dongle-extended-client");
var amiUser = chan_dongle_extended_client_1.misc.amiUser;
var repl = require("./repl");
var dialplan = require("./dialplan");
var api = require("./api");
var bridge = require("./bridge");
var _debug = require("debug");
var debug = _debug("_main");
var modems = new trackable_map_1.TrackableMap();
var ami = chan_dongle_extended_client_1.Ami.getInstance(amiUser);
bridge.start(modems);
dialplan.start(modems, ami);
api.start(modems, ami);
if (process.env["NODE_ENV"] !== "production") {
    repl.start(modems);
}
debug("Started");
var monitor = ts_gsm_modem_1.ConnectionMonitor.getInstance();
monitor.evtModemConnect.attach(function (accessPoint) {
    debug("CONNECT: " + accessPoint.toString());
    createModem(accessPoint);
});
function scheduleRetry(accessPoint) {
    if (!monitor.connectedModems.has(accessPoint))
        return;
    monitor.evtModemDisconnect.waitFor(function (ap) { return ap === accessPoint; }, 2000)
        .catch(function () { return createModem(accessPoint); });
}
function unlock(accessPoint, modemInfos, iccid, pinState, tryLeft, performUnlock) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        var appData, pin, unlockResult, lockedModem;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.read()];
                case 1:
                    appData = _a.sent();
                    pin = appData.pins[iccid || modemInfos.imei];
                    if (!pin) return [3 /*break*/, 4];
                    if (!(pinState === "SIM PIN" && tryLeft === 3)) return [3 /*break*/, 3];
                    return [4 /*yield*/, performUnlock(pin)];
                case 2:
                    unlockResult = _a.sent();
                    if (unlockResult.success)
                        return [2 /*return*/];
                    pinState = unlockResult.pinState;
                    tryLeft = unlockResult.tryLeft;
                    return [3 /*break*/, 4];
                case 3:
                    delete appData.pins[iccid || modemInfos.imei];
                    _a.label = 4;
                case 4:
                    lockedModem = {
                        "imei": modemInfos.imei,
                        "manufacturer": modemInfos.manufacturer,
                        "model": modemInfos.model,
                        "firmwareVersion": modemInfos.firmwareVersion,
                        iccid: iccid, pinState: pinState, tryLeft: tryLeft,
                        "performUnlock": function () {
                            var inputs = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                inputs[_i] = arguments[_i];
                            }
                            return __awaiter(_this, void 0, void 0, function () {
                                var pin, puk, unlockResult, appData;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            //NOTE: Perform result throw error if modem disconnect during unlock
                                            modems.delete(accessPoint);
                                            if (!!inputs[1]) return [3 /*break*/, 2];
                                            pin = inputs[0];
                                            puk = undefined;
                                            return [4 /*yield*/, performUnlock(pin)];
                                        case 1:
                                            unlockResult = _a.sent();
                                            return [3 /*break*/, 4];
                                        case 2:
                                            pin = inputs[1];
                                            puk = inputs[0];
                                            return [4 /*yield*/, performUnlock(puk, pin)];
                                        case 3:
                                            unlockResult = _a.sent();
                                            _a.label = 4;
                                        case 4: return [4 /*yield*/, storage.read()];
                                        case 5:
                                            appData = _a.sent();
                                            if (unlockResult.success) {
                                                debug("Persistent storing of pin: " + pin);
                                                appData.pins[iccid || modemInfos.imei] = pin;
                                            }
                                            else {
                                                delete appData.pins[iccid || modemInfos.imei];
                                                lockedModem.pinState = unlockResult.pinState;
                                                lockedModem.tryLeft = unlockResult.tryLeft;
                                                modems.set(accessPoint, lockedModem);
                                            }
                                            return [2 /*return*/, unlockResult];
                                    }
                                });
                            });
                        }
                    };
                    modems.set(accessPoint, lockedModem);
                    return [2 /*return*/];
            }
        });
    });
}
function createModem(accessPoint) {
    return __awaiter(this, void 0, void 0, function () {
        var modem, error_1, initializationError, modemInfos;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    debug("Create Modem");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ts_gsm_modem_1.Modem.create({
                            "enableTrace": true,
                            "dataIfPath": accessPoint.dataIfPath,
                            "unlock": function (modemInfo, iccid, pinState, tryLeft, performUnlock) {
                                return unlock(accessPoint, modemInfo, iccid, pinState, tryLeft, performUnlock);
                            }
                        })];
                case 2:
                    modem = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    modems.delete(accessPoint);
                    initializationError = error_1;
                    debug("Initialization error: " + initializationError.message);
                    modemInfos = initializationError.modemInfos;
                    if (modemInfos.hasSim !== false) {
                        scheduleRetry(accessPoint);
                    }
                    return [2 /*return*/];
                case 4:
                    modem.evtTerminate.attachOnce(function (error) {
                        modems.delete(accessPoint);
                        debug("Terminate... " + (error ? error.message : "No internal error"));
                        scheduleRetry(accessPoint);
                    });
                    modems.set(accessPoint, modem);
                    return [2 /*return*/];
            }
        });
    });
}
