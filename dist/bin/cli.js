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
require("rejection-tracker").main(__dirname, "..", "..");
var program = require("commander");
var chan_dongle_extended_client_1 = require("../chan-dongle-extended-client");
var storage = require("node-persist");
var path = require("path");
require("colors");
var persistDir = path.join(__dirname, "..", "..", ".node-persist", "storage");
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
                return [4 /*yield*/, storage.init({ "dir": persistDir })];
            case 2:
                _a.sent();
                return [4 /*yield*/, storage.setItem("cli_imei", imei)];
            case 3:
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
            case 0: return [4 /*yield*/, getImei(options)];
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
    .option("-t64, --text-base64 [textBase64]", "Text Base64 encoded")
    .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
    var number, text, textBase64, imei, dc, sendMessageResult, error_2;
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
                return [4 /*yield*/, getDcInstance()];
            case 2:
                dc = _a.sent();
                text = textBase64 ? chan_dongle_extended_client_1.Ami.b64.dec(textBase64) : JSON.parse("\"" + text + "\"");
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, dc.sendMessage(imei, number, text)];
            case 4:
                sendMessageResult = _a.sent();
                if (sendMessageResult.success) {
                    console.log(sendMessageResult.sendDate.getTime());
                    process.exit(0);
                }
                else {
                    console.log(0);
                    process.exit(1);
                }
                return [3 /*break*/, 6];
            case 5:
                error_2 = _a.sent();
                console.log(error_2.message.red);
                process.exit(1);
                return [2 /*return*/];
            case 6: return [2 /*return*/];
        }
    });
}); });
program
    .command("messages")
    .description("Get received SMS")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("-f, --flush", "Whether or not erasing retrieved messages")
    .action(function (options) { return __awaiter(_this, void 0, void 0, function () {
    var flush, imei, dc, dongle, imsi, messages, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                flush = (options.flush === true);
                return [4 /*yield*/, getImei(options)];
            case 1:
                imei = _a.sent();
                return [4 /*yield*/, getDcInstance()];
            case 2:
                dc = _a.sent();
                dongle = dc.activeDongles.get(imei);
                if (!dongle) {
                    console.log("Dongle not currently available");
                    process.exit(1);
                    return [2 /*return*/];
                }
                imsi = dongle.sim.imsi;
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, dc.getMessages({ imsi: imsi, flush: flush })];
            case 4:
                messages = (_a.sent())[imsi];
                if (messages === undefined) {
                    console.log("No messages");
                }
                else {
                    console.log(JSON.stringify(messages, null, 2));
                }
                process.exit(0);
                return [3 /*break*/, 6];
            case 5:
                error_3 = _a.sent();
                console.log(error_3.message.red);
                process.exit(0);
                return [2 /*return*/];
            case 6: return [2 /*return*/];
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
function getDcInstance() {
    return __awaiter(this, void 0, void 0, function () {
        var dc, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    dc = chan_dongle_extended_client_1.DongleController.getInstance();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, dc.initialization];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    console.log("dongle-extended not is running".red);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, dc];
            }
        });
    });
}
/*
program
.command("phonebook")
.description("Get SIM card phonebook")
.option("-i, --imei [imei]", "IMEI of the dongle")
.action(async options => {

    let imei = await getImei(options);

    let phonebook = await DongleExtendedClient
        .localhost()
        .getSimPhonebook(imei);

    console.log(JSON.stringify(phonebook, null, 2));

    process.exit(0);

});

program
.command("new-contact")
.description("Store new contact in phonebook memory")
.option("-i, --imei [imei]", "IMEI of the dongle")
.option("--name [name]", "Contact's name")
.option("--number [number]", "Contact's number")
.action(async options => {

    let { name, number } = options;

    if (!name || !number) {
        console.log("Error: command malformed".red);
        console.log(options.optionHelp());
        process.exit(-1);
    }

    let imei = await getImei(options);

    let contact = await DongleExtendedClient
        .localhost()
        .createContact(imei, name, number);

    console.log(JSON.stringify(contact, null, 2));

    process.exit(0);

});

program
.command("update-number")
.description("Re write subscriber phone number on SIM card")
.option("-i, --imei [imei]", "IMEI of the dongle")
.option("--number [number]", "SIM card phone number")
.action(async options => {

    let { number } = options;

    if (!number) {
        console.log("Error: command malformed".red);
        console.log(options.optionHelp());
        process.exit(-1);
    }

    let imei = await getImei(options);

    await DongleExtendedClient
        .localhost()
        .updateNumber(imei, number);

    console.log("done");

    process.exit(0);

});


program
.command("delete-contact")
.description("Delete a contact from phonebook memory")
.option("-i, --imei [imei]", "IMEI of the dongle")
.option("--index [index]", "Contact's index")
.action(async options => {

    let { index } = options;

    if (!index) {
        console.log("Error: command malformed".red);
        console.log(options.optionHelp());
        process.exit(-1);
    }

    let imei = await getImei(options);

    await DongleExtendedClient
        .localhost()
        .deleteContact(imei, parseInt(index));

    console.log(`Contact index: ${index} successfully deleted`);

    process.exit(0);

});

*/
