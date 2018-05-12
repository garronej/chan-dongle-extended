"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
var ts_gsm_modem_1 = require("ts-gsm-modem");
var trackable_map_1 = require("trackable-map");
var storage = require("./appStorage");
var chan_dongle_extended_client_1 = require("../chan-dongle-extended-client");
var ts_ami_1 = require("ts-ami");
var repl = require("./repl");
var dialplan = require("./dialplan");
var api = require("./api");
var atBridge = require("./atBridge");
var ts_events_extended_1 = require("ts-events-extended");
var confManager = require("./confManager");
var logger_1 = require("./logger");
var child_process_1 = require("child_process");
var localManger = require("./localsManager");
require("colors");
var debugFactory = require("debug");
var debug = debugFactory("main");
debug.enabled = true;
debug.log = logger_1.log;
var modems = new trackable_map_1.TrackableMap();
var evtScheduleRetry = new ts_events_extended_1.SyncEvent();
function launch() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, locals, astdirs, ami, chanDongleConfManagerApi, defaults, monitor;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = localManger.get(), locals = _a.locals, astdirs = _a.astdirs;
                    ami = ts_ami_1.Ami.getInstance(chan_dongle_extended_client_1.misc.amiUser, astdirs.astetcdir);
                    return [4 /*yield*/, confManager.getApi(ami)];
                case 1:
                    chanDongleConfManagerApi = _b.sent();
                    setExitHandlers(chanDongleConfManagerApi);
                    if (locals.build_across_linux_kernel !== "" + child_process_1.execSync("uname -r")) {
                        debug("Kernel have been updated, tty0tty need to be re compiled");
                        process.emit("beforeExit", 0);
                    }
                    if (!locals.disable_sms_dialplan) {
                        defaults = chanDongleConfManagerApi.staticModuleConfiguration.defaults;
                        dialplan.init(modems, ami, defaults["context"], defaults["exten"]);
                    }
                    return [4 /*yield*/, atBridge.init(modems, chanDongleConfManagerApi)];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, api.launch(modems, chanDongleConfManagerApi.staticModuleConfiguration)];
                case 3:
                    _b.sent();
                    if (process.env["NODE_ENV"] !== "production") {
                        repl.start(modems);
                    }
                    debug("Started");
                    monitor = ts_gsm_modem_1.ConnectionMonitor.getInstance(logger_1.log);
                    monitor.evtModemConnect.attach(function (accessPoint) { return createModem(accessPoint); });
                    evtScheduleRetry.attach(function (accessPoint) {
                        if (!monitor.connectedModems.has(accessPoint)) {
                            return;
                        }
                        monitor.evtModemDisconnect
                            .waitFor(function (ap) { return ap === accessPoint; }, 2000)
                            .catch(function () { return createModem(accessPoint); });
                    });
                    return [2 /*return*/];
            }
        });
    });
}
exports.launch = launch;
;
function createModem(accessPoint) {
    return __awaiter(this, void 0, void 0, function () {
        var modem, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    debug("Create Modem");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ts_gsm_modem_1.Modem.create({
                            "dataIfPath": accessPoint.dataIfPath,
                            "unlock": function (modemInfo, iccid, pinState, tryLeft, performUnlock) {
                                return onLockedModem(accessPoint, modemInfo, iccid, pinState, tryLeft, performUnlock);
                            },
                            log: logger_1.log,
                        })];
                case 2:
                    modem = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    onModemInitializationFailed(accessPoint, error_1.message, error_1.modemInfos);
                    return [2 /*return*/];
                case 4:
                    onModem(accessPoint, modem);
                    return [2 /*return*/];
            }
        });
    });
}
function onModemInitializationFailed(accessPoint, message, modemInfos) {
    debug(("Modem initialization failed: " + message).red, modemInfos);
    modems.delete(accessPoint);
    if (modemInfos.hasSim !== false) {
        evtScheduleRetry.post(accessPoint);
    }
}
function onLockedModem(accessPoint, modemInfos, iccid, pinState, tryLeft, performUnlock) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        var appData, pin, unlockResult, lockedModem;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    debug("onLockedModem", __assign({}, modemInfos, { iccid: iccid, pinState: pinState, tryLeft: tryLeft }));
                    return [4 /*yield*/, storage.read()];
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
                                            //NOTE: PerformUnlock throw error if modem disconnect during unlock
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
function onModem(accessPoint, modem) {
    debug("Modem successfully initialized".green);
    modem.evtTerminate.attachOnce(function (error) {
        modems.delete(accessPoint);
        debug("Terminate... " + (error ? error.message : "No internal error"));
        evtScheduleRetry.post(accessPoint);
    });
    modems.set(accessPoint, modem);
}
function setExitHandlers(chanDongleConfManagerApi) {
    var _this = this;
    var cleanupAndExit = function (code) { return __awaiter(_this, void 0, void 0, function () {
        var exitSync, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    exitSync = function () {
                        if (code !== 0) {
                            debug("Create crash report");
                            logger_1.createCrashReport();
                        }
                        else {
                            debug("Backup log");
                            logger_1.backupCurrentLog();
                        }
                        process.exit(code);
                    };
                    debug("cleaning up and exiting with code " + code);
                    setTimeout(function () {
                        debug("Force quit");
                        exitSync();
                    }, 2000);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, chanDongleConfManagerApi.reset()];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4:
                    exitSync();
                    return [2 /*return*/];
            }
        });
    }); };
    //Ctrl+C
    process.once("SIGINT", function () {
        debug("Ctrl+C pressed ( SIGINT )");
        cleanupAndExit(2);
    });
    process.once("SIGUSR2", function () {
        debug("Stop script called (SIGUSR2)");
        cleanupAndExit(0);
    });
    process.once("beforeExit", function (code) { return cleanupAndExit(code); });
    process.removeAllListeners("uncaughtException");
    process.once("uncaughtException", function (error) {
        debug("uncaughtException", error);
        cleanupAndExit(-1);
    });
    process.removeAllListeners("unhandledRejection");
    process.once("unhandledRejection", function (error) {
        debug("unhandledRejection", error);
        cleanupAndExit(-1);
    });
}
