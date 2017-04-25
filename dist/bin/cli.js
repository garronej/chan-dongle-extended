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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
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
require("rejection-tracker").main(__dirname, "..", "..");
var program = require("commander");
var chan_dongle_extended_client_1 = require("chan-dongle-extended-client");
var storage = require("node-persist");
var path = require("path");
require("colors");
var persistDir = path.join(__dirname, "..", "..", ".node-persist", "storage");
program
    .command("list")
    .description("List active dongle")
    .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
    var dongles;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, chan_dongle_extended_client_1.DongleExtendedClient.localhost().getActiveDongles()];
            case 1:
                dongles = _a.sent();
                console.log(JSON.stringify(dongles, null, 2));
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("list-locked")
    .description("List PIN/PUK locked dongles")
    .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
    var dongles;
    return __generator(this, function (_a) {
        dongles = chan_dongle_extended_client_1.DongleExtendedClient.localhost().getLockedDongles();
        console.log(JSON.stringify(dongles, null, 2));
        process.exit(0);
        return [2 /*return*/];
    });
}); });
program
    .command("select [imei]")
    .description([
    "Select dongle for subsequent calls",
    " ( to avoid having to set --imei on each command)"
].join(""))
    .action(function (imei) { return __awaiter(_this, void 0, void 0, function () {
    var client, arrImei, _i, _a, imei_1, _b, _c, imei_2;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                if (!imei) {
                    console.log("Error: command malformed".red);
                    process.exit(-1);
                }
                client = chan_dongle_extended_client_1.DongleExtendedClient.localhost();
                arrImei = [];
                _i = 0;
                return [4 /*yield*/, client.getActiveDongles()];
            case 1:
                _a = _d.sent();
                _d.label = 2;
            case 2:
                if (!(_i < _a.length)) return [3 /*break*/, 4];
                imei_1 = _a[_i].imei;
                arrImei.push(imei_1);
                _d.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 2];
            case 4:
                _b = 0;
                return [4 /*yield*/, client.getLockedDongles()];
            case 5:
                _c = _d.sent();
                _d.label = 6;
            case 6:
                if (!(_b < _c.length)) return [3 /*break*/, 8];
                imei_2 = _c[_b].imei;
                arrImei.push(imei_2);
                _d.label = 7;
            case 7:
                _b++;
                return [3 /*break*/, 6];
            case 8:
                if (arrImei.indexOf(imei) < 0) {
                    console.log("Error: no such dongle connected".red);
                    process.exit(-1);
                }
                return [4 /*yield*/, storage.init({ "dir": persistDir })];
            case 9:
                _d.sent();
                return [4 /*yield*/, storage.setItem("cli_imei", imei)];
            case 10:
                _d.sent();
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
    var imei, client, match, puk, newPin;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getImei(options)];
            case 1:
                imei = _a.sent();
                if (!options.pin && !options.puk) {
                    console.log("Error: command malformed".red);
                    console.log(options.optionHelp());
                    process.exit(-1);
                }
                client = chan_dongle_extended_client_1.DongleExtendedClient.localhost();
                if (!options.pin) return [3 /*break*/, 3];
                return [4 /*yield*/, client.unlockDongle(imei, options.pin)];
            case 2:
                _a.sent();
                return [3 /*break*/, 5];
            case 3:
                match = options.puk.match(/^([0-9]{8})-([0-9]{4})$/);
                if (!match) {
                    console.log("Error: puk-newPin malformed".red);
                    console.log(options.optionHelp());
                    return [2 /*return*/, process.exit(-1)];
                }
                puk = match[1];
                newPin = match[2];
                return [4 /*yield*/, client.unlockDongle(imei, puk, newPin)];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5:
                console.log("done");
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
    .option("-ut, --uri-encoded-text [uriEncodedText]", "Text URI encoded")
    .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
    var number, text, uriEncodedText, imei, messageId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                number = options.number, text = options.text, uriEncodedText = options.uriEncodedText;
                if (!number || (!text && !uriEncodedText)) {
                    console.log("Error: command malformed".red);
                    console.log(options.optionHelp());
                    process.exit(-1);
                }
                return [4 /*yield*/, getImei(options)];
            case 1:
                imei = _a.sent();
                text = uriEncodedText ? decodeURI(uriEncodedText) : JSON.parse("\"" + text + "\"");
                return [4 /*yield*/, chan_dongle_extended_client_1.DongleExtendedClient
                        .localhost()
                        .sendMessage(imei, number, text)];
            case 2:
                messageId = _a.sent();
                console.log(messageId);
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("phonebook")
    .description("Get SIM card phonebook")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
    var imei, phonebook;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getImei(options)];
            case 1:
                imei = _a.sent();
                return [4 /*yield*/, chan_dongle_extended_client_1.DongleExtendedClient
                        .localhost()
                        .getSimPhonebook(imei)];
            case 2:
                phonebook = _a.sent();
                console.log(JSON.stringify(phonebook, null, 2));
                process.exit(0);
                return [2 /*return*/];
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
    var name, number, imei, contact;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                name = options.name, number = options.number;
                if (!name || !number) {
                    console.log("Error: command malformed".red);
                    console.log(options.optionHelp());
                    process.exit(-1);
                }
                return [4 /*yield*/, getImei(options)];
            case 1:
                imei = _a.sent();
                return [4 /*yield*/, chan_dongle_extended_client_1.DongleExtendedClient
                        .localhost()
                        .createContact(imei, name, number)];
            case 2:
                contact = _a.sent();
                console.log(JSON.stringify(contact, null, 2));
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("update-number")
    .description("Re write subscriber phone number on SIM card")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("--number [number]", "SIM card phone number")
    .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
    var number, imei;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                number = options.number;
                if (!number) {
                    console.log("Error: command malformed".red);
                    console.log(options.optionHelp());
                    process.exit(-1);
                }
                return [4 /*yield*/, getImei(options)];
            case 1:
                imei = _a.sent();
                return [4 /*yield*/, chan_dongle_extended_client_1.DongleExtendedClient
                        .localhost()
                        .updateNumber(imei, number)];
            case 2:
                _a.sent();
                console.log("done");
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
    var index, imei;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                index = options.index;
                if (!index) {
                    console.log("Error: command malformed".red);
                    console.log(options.optionHelp());
                    process.exit(-1);
                }
                return [4 /*yield*/, getImei(options)];
            case 1:
                imei = _a.sent();
                return [4 /*yield*/, chan_dongle_extended_client_1.DongleExtendedClient
                        .localhost()
                        .deleteContact(imei, parseInt(index))];
            case 2:
                _a.sent();
                console.log("Contact index: " + index + " successfully deleted");
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("messages")
    .description("Get received SMS")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("-f, --flush", "Whether or not erasing retrieved messages")
    .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
    var flush, imei, messages;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                flush = (options.flush === true);
                return [4 /*yield*/, getImei(options)];
            case 1:
                imei = _a.sent();
                return [4 /*yield*/, chan_dongle_extended_client_1.DongleExtendedClient
                        .localhost()
                        .getMessages(imei, flush)];
            case 2:
                messages = _a.sent();
                console.log(JSON.stringify(messages, null, 2));
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program.parse(process.argv);
function getImei(options) {
    return __awaiter(this, void 0, void 0, function () {
        var imei;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (options.imei)
                        return [2 /*return*/, options.imei];
                    return [4 /*yield*/, storage.init({ "dir": persistDir })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, storage.getItem("cli_imei")];
                case 2:
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
//# sourceMappingURL=cli.js.map