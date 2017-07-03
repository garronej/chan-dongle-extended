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
var program = require("commander");
var chan_dongle_extended_client_1 = require("chan-dongle-extended-client");
var storage = require("node-persist");
var path = require("path");
var js_base64_1 = require("js-base64");
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
        switch (_a.label) {
            case 0: return [4 /*yield*/, chan_dongle_extended_client_1.DongleExtendedClient.localhost().getLockedDongles()];
            case 1:
                dongles = _a.sent();
                console.log(JSON.stringify(dongles, null, 2));
                process.exit(0);
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
    var client, arrImei, _a, _b, imei_1, e_1_1, _c, _d, imei_2, e_2_1, e_1, _e, e_2, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                if (!imei) {
                    console.log("Error: command malformed".red);
                    process.exit(-1);
                }
                client = chan_dongle_extended_client_1.DongleExtendedClient.localhost();
                arrImei = [];
                _g.label = 1;
            case 1:
                _g.trys.push([1, 6, 7, 8]);
                return [4 /*yield*/, client.getActiveDongles()];
            case 2:
                _a = __values.apply(void 0, [_g.sent()]), _b = _a.next();
                _g.label = 3;
            case 3:
                if (!!_b.done) return [3 /*break*/, 5];
                imei_1 = _b.value.imei;
                arrImei.push(imei_1);
                _g.label = 4;
            case 4:
                _b = _a.next();
                return [3 /*break*/, 3];
            case 5: return [3 /*break*/, 8];
            case 6:
                e_1_1 = _g.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 8];
            case 7:
                try {
                    if (_b && !_b.done && (_e = _a.return)) _e.call(_a);
                }
                finally { if (e_1) throw e_1.error; }
                return [7 /*endfinally*/];
            case 8:
                _g.trys.push([8, 13, 14, 15]);
                return [4 /*yield*/, client.getLockedDongles()];
            case 9:
                _c = __values.apply(void 0, [_g.sent()]), _d = _c.next();
                _g.label = 10;
            case 10:
                if (!!_d.done) return [3 /*break*/, 12];
                imei_2 = _d.value.imei;
                arrImei.push(imei_2);
                _g.label = 11;
            case 11:
                _d = _c.next();
                return [3 /*break*/, 10];
            case 12: return [3 /*break*/, 15];
            case 13:
                e_2_1 = _g.sent();
                e_2 = { error: e_2_1 };
                return [3 /*break*/, 15];
            case 14:
                try {
                    if (_d && !_d.done && (_f = _c.return)) _f.call(_c);
                }
                finally { if (e_2) throw e_2.error; }
                return [7 /*endfinally*/];
            case 15:
                if (arrImei.indexOf(imei) < 0) {
                    console.log("Error: no such dongle connected".red);
                    process.exit(-1);
                }
                return [4 /*yield*/, storage.init({ "dir": persistDir })];
            case 16:
                _g.sent();
                return [4 /*yield*/, storage.setItem("cli_imei", imei)];
            case 17:
                _g.sent();
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
    .option("-t64, --text-base64 [textBase64]", "Text Base64 encoded")
    .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
    var number, text, textBase64, imei, messageId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                number = options.number, text = options.text, textBase64 = options.textBase64;
                if (!number || (!text && !textBase64)) {
                    console.log("Error: command malformed".red);
                    console.log(options.optionHelp());
                    process.exit(-1);
                }
                return [4 /*yield*/, getImei(options)];
            case 1:
                imei = _a.sent();
                text = textBase64 ? js_base64_1.Base64.decode(textBase64) : JSON.parse("\"" + text + "\"");
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
