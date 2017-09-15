"use strict";
/*<HARDWARE>usb<-->accessPoint.dataIfPath<THIS MODULE>voidModem.leftEnd<-->voidModem.rightEnd<CHAN DONGLE>*/
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
var ts_gsm_modem_1 = require("ts-gsm-modem");
var chanDongleConfManager_1 = require("./chanDongleConfManager");
var Tty0tty_1 = require("./Tty0tty");
var main_1 = require("./main");
var _debug = require("debug");
var debug = _debug("_main.bridge");
main_1.activeModems.evtSet.attach(function (_a) {
    var _b = __read(_a, 2), modem = _b[0], accessPoint = _b[1];
    return __awaiter(_this, void 0, void 0, function () {
        var _this = this;
        var dongleName, voidModem, portVirtual;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (1 + 1 === 3) {
                        debug("chan_dongle bridge disabled !");
                        return [2 /*return*/];
                    }
                    dongleName = main_1.getDongleName(accessPoint);
                    voidModem = Tty0tty_1.Tty0tty.getPair();
                    chanDongleConfManager_1.chanDongleConfManager.addDongle({
                        dongleName: dongleName,
                        "data": voidModem.rightEnd,
                        "audio": accessPoint.audioIfPath
                    });
                    portVirtual = new ts_gsm_modem_1.SerialPortExt(voidModem.leftEnd, {
                        "baudRate": 115200,
                        "parser": ts_gsm_modem_1.SerialPortExt.parsers.readline("\r")
                    });
                    modem.evtTerminate.attachOnce(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    debug("Modem terminate => closing bridge");
                                    return [4 /*yield*/, chanDongleConfManager_1.chanDongleConfManager.removeDongle(dongleName)];
                                case 1:
                                    _a.sent();
                                    debug("Dongle removed from chan dongle config");
                                    if (!portVirtual.isOpen()) return [3 /*break*/, 3];
                                    return [4 /*yield*/, new Promise(function (resolve) { return portVirtual.close(function () { return resolve(); }); })];
                                case 2:
                                    _a.sent();
                                    debug("Virtual port closed");
                                    _a.label = 3;
                                case 3:
                                    voidModem.release();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    portVirtual.evtError.attach(function (serialPortError) {
                        debug("uncaught error serialPortVirtual", serialPortError);
                        modem.terminate(new Error("Bridge serialport error"));
                    });
                    portVirtual.on("data", function (buff) {
                        if (modem.isTerminated)
                            return;
                        var command = buff.toString("utf8") + "\r";
                        var forwardResp = function (rawResp) {
                            if (modem.runCommand_isRunning) {
                                debug([
                                    "Newer command from chanDongle",
                                    "dropping " + JSON.stringify(rawResp) + " response to " + JSON.stringify(command) + " command"
                                ].join("\n").red);
                                return;
                            }
                            debug("response: " + JSON.stringify(rawResp).blue);
                            portVirtual.writeAndDrain(rawResp);
                        };
                        debug("from chan_dongle: " + JSON.stringify(command));
                        if (command === "ATZ\r" ||
                            command === "AT\r" ||
                            command.match(/^AT\+CNMI=/)) {
                            debug("fake resp...");
                            forwardResp("\r\nOK\r\n");
                            return;
                        }
                        if (modem.runCommand_isRunning) {
                            debug([
                                "a command is already running",
                                modem.runCommand_queuedCallCount + " command in stack",
                                "flushing the pending command in stack"
                            ].join("\n").yellow);
                            modem.runCommand_cancelAllQueuedCalls();
                        }
                        modem.runCommand(command, {
                            "recoverable": true,
                            "reportMode": ts_gsm_modem_1.AtMessage.ReportMode.NO_DEBUG_INFO,
                            "retryOnErrors": false
                        }, function (_, __, rawResp) { return forwardResp(rawResp); });
                    });
                    return [4 /*yield*/, portVirtual.evtData.waitFor()];
                case 1:
                    _a.sent();
                    modem.evtUnsolicitedAtMessage.attach(function (urc) {
                        debug("forwarding urc: " + JSON.stringify(urc.raw));
                        portVirtual.writeAndDrain(urc.raw);
                    });
                    return [2 /*return*/];
            }
        });
    });
});
