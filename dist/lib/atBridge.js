"use strict";
/*<HARDWARE>usb<-->accessPoint.dataIfPath<THIS MODULE>tty0tty.leftEnd<-->tty0tty.rightEnd<CHAN DONGLE>*/
/*<HARDWARE>usb<-->/dev/ttyUSB1<THIS MODULE>/dev/tnt0<-->/dev/tnt1<CHAN DONGLE>*/
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
var ts_gsm_modem_1 = require("ts-gsm-modem");
var Tty0tty_1 = require("./Tty0tty");
var logger = require("logger");
var types = require("./types");
var ts_events_extended_1 = require("ts-events-extended");
var debug = logger.debugFactory();
function readableAt(raw) {
    return "`" + raw.replace(/\r/g, "\\r").replace(/\n/g, "\\n") + "`";
}
function init(modems, chanDongleConfManagerApi) {
    var _this = this;
    atBridge.confManagerApi = chanDongleConfManagerApi;
    var tty0ttyFactory = Tty0tty_1.Tty0tty.makeFactory();
    modems.evtCreate.attach(function (_a) {
        var _b = __read(_a, 2), modem = _b[0], accessPoint = _b[1];
        return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (types.LockedModem.match(modem)) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, modem.runCommand("AT+CCWA=0,0,1\r", {
                                "recoverable": true,
                                "retryOnErrors": [30, 257]
                            }).then(function (_a) {
                                var final = _a.final;
                                return debug("Configure modem to reject call waiting:", final.isError ? final : "SUCCESS");
                            })];
                    case 1:
                        _c.sent();
                        atBridge(accessPoint, modem, tty0ttyFactory());
                        return [2 /*return*/];
                }
            });
        });
    });
}
exports.init = init;
function waitForTerminate() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (waitForTerminate.ports.size === 0) {
                        return [2 /*return*/, Promise.resolve()];
                    }
                    return [4 /*yield*/, waitForTerminate.evtAllClosed.waitFor()];
                case 1:
                    _a.sent();
                    debug("All virtual serial ports closed");
                    return [2 /*return*/];
            }
        });
    });
}
exports.waitForTerminate = waitForTerminate;
(function (waitForTerminate) {
    waitForTerminate.ports = new Set();
    waitForTerminate.evtAllClosed = new ts_events_extended_1.VoidSyncEvent();
})(waitForTerminate = exports.waitForTerminate || (exports.waitForTerminate = {}));
function atBridge(accessPoint, modem, tty0tty) {
    var _this = this;
    atBridge.confManagerApi.addDongle({
        "dongleName": accessPoint.friendlyId,
        "data": tty0tty.rightEnd,
        "audio": accessPoint.audioIfPath
    });
    var portVirtual = new ts_gsm_modem_1.SerialPortExt(tty0tty.leftEnd, {
        "baudRate": 115200,
        "parser": ts_gsm_modem_1.SerialPortExt.parsers.readline("\r")
    });
    waitForTerminate.ports.add(portVirtual);
    portVirtual.once("close", function () {
        waitForTerminate.ports.delete(portVirtual);
        if (waitForTerminate.ports.size === 0) {
            waitForTerminate.evtAllClosed.post();
        }
    });
    modem.evtTerminate.attachOnce(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    debug("Modem terminate => closing bridge");
                    return [4 /*yield*/, atBridge.confManagerApi.removeDongle(accessPoint.friendlyId)];
                case 1:
                    _a.sent();
                    if (!portVirtual.isOpen()) return [3 /*break*/, 3];
                    return [4 /*yield*/, new Promise(function (resolve) { return portVirtual.close(function () { return resolve(); }); })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    tty0tty.release();
                    return [2 /*return*/];
            }
        });
    }); });
    portVirtual.evtError.attach(function (serialPortError) {
        debug("uncaught error serialPortVirtual", serialPortError);
        modem.terminate();
    });
    var serviceProviderShort = (modem.serviceProviderName || "Unknown SP").substring(0, 15);
    var forwardResp = function (rawResp, isRespFromModem, isPing) {
        if (isPing === void 0) { isPing = false; }
        if (modem.runCommand_isRunning) {
            debug(("Newer command from chanDongle, dropping response " + readableAt(rawResp)).red);
            return;
        }
        if (!isPing) {
            debug("(AT) " + (!isRespFromModem ? "( fake ) " : "") + "modem response: " + readableAt(rawResp));
        }
        portVirtual.writeAndDrain(rawResp);
    };
    portVirtual.on("data", function (buff) {
        if (!!modem.terminateState) {
            return;
        }
        var command = buff.toString("utf8") + "\r";
        if (command !== "AT\r") {
            debug("(AT) command from asterisk-chan-dongle: " + readableAt(command));
        }
        var ok = "\r\nOK\r\n";
        if (command === "ATZ\r" ||
            command.match(/^AT\+CNMI=/)) {
            forwardResp(ok, false);
            return;
        }
        else if (command === "AT\r") {
            forwardResp(ok, false, true);
            modem.ping();
            return;
        }
        else if (command === "AT+COPS?\r") {
            forwardResp("\r\n+COPS: 0,0,\"" + serviceProviderShort + "\",0\r\n" + ok, false);
            return;
        }
        if (modem.runCommand_queuedCallCount) {
            debug([
                "a command is already running and",
                modem.runCommand_queuedCallCount + " command in stack",
                "flushing the pending command in stack"
            ].join("\n").yellow);
        }
        modem.runCommand_cancelAllQueuedCalls();
        modem.runCommand(command, {
            "recoverable": true,
            "reportMode": ts_gsm_modem_1.AtMessage.ReportMode.NO_DEBUG_INFO,
            "retryOnErrors": false
        }).then(function (_a) {
            var raw = _a.raw;
            return forwardResp(raw, true);
        });
    });
    portVirtual.once("data", function () {
        return modem.evtUnsolicitedAtMessage.attach(function (urc) {
            var doNotForward = (urc.id === "CX_BOOT_URC" ||
                (urc instanceof ts_gsm_modem_1.AtMessage.P_CMTI_URC) && (urc.index < 0 ||
                    atBridge.confManagerApi.staticModuleConfiguration.defaults["disablesms"] === "yes"));
            if (!doNotForward) {
                portVirtual.writeAndDrain(urc.raw);
            }
            debug("(AT) urc: " + readableAt(urc.raw) + " ( " + (doNotForward ? "NOT forwarded" : "forwarded") + " to asterisk-chan-dongle )");
        });
    });
}
;
(function (atBridge) {
})(atBridge || (atBridge = {}));
