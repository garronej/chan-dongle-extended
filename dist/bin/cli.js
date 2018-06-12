#!/usr/bin/env node
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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var program = require("commander");
var chan_dongle_extended_client_1 = require("../chan-dongle-extended-client");
var storage = require("node-persist");
var InstallOptions_1 = require("../lib/InstallOptions");
var path = require("path");
var os = require("os");
require("colors");
program
    .command("list")
    .description("List dongles")
    .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
    var dc;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getDcInstance()];
            case 1:
                dc = _a.sent();
                try {
                    console.log(JSON.stringify(dc.dongles.valuesAsArray(), null, 2));
                    process.exit(0);
                }
                catch (error) {
                    console.log(error.message.red);
                    process.exit(1);
                }
                return [2 /*return*/];
        }
    });
}); });
program
    .command("select [imei]")
    .description([
    "Select dongle for subsequent calls",
    " ( to avoid having to set --imei on each command)"
].join(""))
    .action(function (imei) { return __awaiter(_this, void 0, void 0, function () {
    var dc;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!imei) {
                    console.log("Error: command malformed".red);
                    process.exit(-1);
                }
                return [4 /*yield*/, getDcInstance()];
            case 1:
                dc = _a.sent();
                if (!dc.dongles.has(imei)) {
                    console.log("Error: no such dongle connected".red);
                    process.exit(-1);
                }
                return [4 /*yield*/, selected_dongle.set(imei)];
            case 2:
                _a.sent();
                console.log("Dongle " + imei + " selected");
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("unlock")
    .description("provide SIM PIN or PUK to unlock dongle")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("-p, --pin [pin]", "SIM PIN ( 4 digits )")
    .option("--puk [puk-newPin]", "PUK ( 8 digits ) and new PIN eg. --puk 12345678-0000")
    .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
    var imei, dc, unlockResult, match, puk, newPin, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, selected_dongle.get(options)];
            case 1:
                imei = _a.sent();
                if (!options.pin && !options.puk) {
                    console.log("Error: command malformed".red);
                    console.log(options.optionHelp());
                    process.exit(-1);
                }
                return [4 /*yield*/, getDcInstance()];
            case 2:
                dc = _a.sent();
                _a.label = 3;
            case 3:
                _a.trys.push([3, 8, , 9]);
                if (!options.pin) return [3 /*break*/, 5];
                return [4 /*yield*/, dc.unlock(imei, options.pin)];
            case 4:
                unlockResult = _a.sent();
                return [3 /*break*/, 7];
            case 5:
                match = options.puk.match(/^([0-9]{8})-([0-9]{4})$/);
                if (!match) {
                    console.log("Error: puk-newPin malformed".red);
                    console.log(options.optionHelp());
                    process.exit(-1);
                    return [2 /*return*/];
                }
                puk = match[1];
                newPin = match[2];
                return [4 /*yield*/, dc.unlock(imei, puk, newPin)];
            case 6:
                unlockResult = _a.sent();
                _a.label = 7;
            case 7: return [3 /*break*/, 9];
            case 8:
                error_1 = _a.sent();
                console.log(error_1.message.red);
                process.exit(1);
                return [2 /*return*/];
            case 9:
                console.log(JSON.stringify(unlockResult, null, 2));
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("send")
    .description("Send SMS")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("-n, --number [number]", "target phone number")
    .option("-t, --text [text]", "Text of the message")
    .option("-T, --text-base64 [textBase64]", "Text Base64 encoded")
    .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
    var number, text, textBase64, imei, dc, st, sendMessageResult, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                number = options.number, text = options.text, textBase64 = options.textBase64;
                if (!number || (!text && !textBase64)) {
                    console.log("Error: command malformed".red);
                    console.log(options.optionHelp());
                    process.exit(-1);
                }
                return [4 /*yield*/, selected_dongle.get(options)];
            case 1:
                imei = _a.sent();
                return [4 /*yield*/, getDcInstance()];
            case 2:
                dc = _a.sent();
                if (!textBase64) return [3 /*break*/, 4];
                return [4 /*yield*/, Promise.resolve().then(function () { return require("transfer-tools/dist/lib/stringTransform"); })];
            case 3:
                st = _a.sent();
                text = st.safeBufferFromTo(textBase64, "base64", "utf8");
                return [3 /*break*/, 5];
            case 4:
                text = JSON.parse("\"" + text + "\"");
                _a.label = 5;
            case 5:
                _a.trys.push([5, 7, , 8]);
                return [4 /*yield*/, dc.sendMessage(imei, number, text)];
            case 6:
                sendMessageResult = _a.sent();
                if (sendMessageResult.success) {
                    console.log(sendMessageResult.sendDate.getTime());
                    process.exit(0);
                }
                else {
                    console.log(0);
                    process.exit(1);
                }
                return [3 /*break*/, 8];
            case 7:
                error_2 = _a.sent();
                console.log(error_2.message.red);
                process.exit(1);
                return [2 /*return*/];
            case 8: return [2 /*return*/];
        }
    });
}); });
program
    .command("messages")
    .description("Get received SMS")
    .option("-f, --flush", "Whether or not erasing retrieved messages")
    .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
    var flush, dc, messages, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                flush = options.flush === true;
                return [4 /*yield*/, getDcInstance()];
            case 1:
                dc = _a.sent();
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, dc.getMessages({ flush: flush })];
            case 3:
                messages = _a.sent();
                console.log(JSON.stringify(messages, null, 2));
                process.exit(0);
                return [3 /*break*/, 5];
            case 4:
                error_3 = _a.sent();
                console.log(error_3.message.red);
                process.exit(1);
                return [2 /*return*/];
            case 5: return [2 /*return*/];
        }
    });
}); });
program
    .command("new-contact")
    .description("Store new contact in phonebook memory")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("--name [name]", "Contact's name")
    .option("--number [number]", "Contact's number")
    .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
    var name, number, imei, dc, dongle, contact, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                name = options.name, number = options.number;
                if (!name || !number) {
                    console.log("Error: provide at least one of number or name".red);
                    console.log(options.optionHelp());
                    process.exit(-1);
                }
                return [4 /*yield*/, selected_dongle.get(options)];
            case 1:
                imei = _a.sent();
                return [4 /*yield*/, getDcInstance()];
            case 2:
                dc = _a.sent();
                dongle = dc.usableDongles.get(imei);
                if (!dongle) {
                    console.log("Error: selected dongle is disconnected or locked".red);
                    process.exit(1);
                    return [2 /*return*/];
                }
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, dc.createContact(dongle.sim.imsi, number, name)];
            case 4:
                contact = _a.sent();
                return [3 /*break*/, 6];
            case 5:
                error_4 = _a.sent();
                console.log(error_4.message.red);
                process.exit(1);
                return [2 /*return*/];
            case 6:
                console.log(JSON.stringify(contact, null, 2));
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("delete-contact")
    .description("Delete a contact from phonebook memory")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("--index [index]", "Contact's index")
    .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
    var index, imei, dc, dongle, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                index = parseInt(options["index"]);
                if (isNaN(index)) {
                    console.log("Error: command malformed".red);
                    console.log(options.optionHelp());
                    process.exit(-1);
                }
                return [4 /*yield*/, selected_dongle.get(options)];
            case 1:
                imei = _a.sent();
                return [4 /*yield*/, getDcInstance()];
            case 2:
                dc = _a.sent();
                dongle = dc.usableDongles.get(imei);
                if (!dongle) {
                    console.log("Error: selected dongle is disconnected or locked".red);
                    process.exit(1);
                    return [2 /*return*/];
                }
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, dc.deleteContact(dongle.sim.imsi, index)];
            case 4:
                _a.sent();
                return [3 /*break*/, 6];
            case 5:
                error_5 = _a.sent();
                console.log(error_5.message.red);
                process.exit(1);
                return [2 /*return*/];
            case 6:
                console.log("Contact at index " + index + " in SIM memory have been deleted successfully.");
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
function getDcInstance() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, bind_addr, port, dc, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = InstallOptions_1.InstallOptions.get(), bind_addr = _a.bind_addr, port = _a.port;
                    dc = chan_dongle_extended_client_1.DongleController.getInstance(bind_addr, port);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, dc.prInitialization];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _b = _c.sent();
                    console.log("dongle-extended is not running".red);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, dc];
            }
        });
    });
}
var selected_dongle;
(function (selected_dongle) {
    var get_storage_user_path = function () { return path.join("/var/tmp", os.userInfo().username + "_selected_dongle"); };
    function get(options) {
        return __awaiter(this, void 0, void 0, function () {
            var imei;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!options.imei) return [3 /*break*/, 1];
                        return [2 /*return*/, options.imei];
                    case 1: return [4 /*yield*/, storage.init({ "dir": get_storage_user_path() })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, storage.getItem("cli_imei")];
                    case 3:
                        imei = _a.sent();
                        if (!imei) {
                            console.log("Error: No dongle selected");
                            process.exit(-1);
                        }
                        return [2 /*return*/, imei];
                }
            });
        });
    }
    selected_dongle.get = get;
    function set(imei) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, storage.init({ "dir": get_storage_user_path() })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, storage.setItem("cli_imei", imei)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    selected_dongle.set = set;
})(selected_dongle || (selected_dongle = {}));
if (require.main === module) {
    process.removeAllListeners("unhandledRejection");
    process.once("unhandledRejection", function (error) { throw error; });
    program.parse(process.argv);
}
