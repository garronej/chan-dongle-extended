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
var ts_ami_1 = require("ts-ami");
var _1 = require("chan-dongle-extended-client/");
var chanDongleConfManager_1 = require("./chanDongleConfManager");
var dialplanContext = chanDongleConfManager_1.chanDongleConfManager.getConfig().defaults.context;
var _debug = require("debug");
var debug = _debug("_dialplan");
function notifyStatusReport(dongle, statusReport) {
    return __awaiter(this, void 0, void 0, function () {
        var ami, name, number, provider, imei, imsi, dischargeTime, isDelivered, messageId, status, recipient, variable;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ami = ts_ami_1.Ami.localhost({ "user": _1.amiUser });
                    name = dongle.name, number = dongle.number, provider = dongle.provider, imei = dongle.imei, imsi = dongle.imsi;
                    dischargeTime = statusReport.dischargeTime, isDelivered = statusReport.isDelivered, messageId = statusReport.messageId, status = statusReport.status, recipient = statusReport.recipient;
                    variable = {
                        "DONGLENAME": name,
                        "DONGLEPROVIDER": provider,
                        "DONGLEIMEI": imei,
                        "DONGLEIMSI": imsi,
                        "DONGLENUMBER": number,
                        "STATUS_REPORT_DISCHARGE_TIME": isNaN(dischargeTime.getTime()) ? "" + dischargeTime : dischargeTime.toISOString(),
                        "STATUS_REPORT_IS_DELIVERED": "" + isDelivered,
                        "STATUS_REPORT_ID": "" + messageId,
                        "STATUS_REPORT_STATUS": status,
                        "STATUS_REPORT_RECIPIENT": recipient
                    };
                    return [4 /*yield*/, ami.originateLocalChannel(dialplanContext, "sms-status-report", variable)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.notifyStatusReport = notifyStatusReport;
function notifySms(dongle, message) {
    return __awaiter(this, void 0, void 0, function () {
        var ami, name, number, provider, imei, imsi, keywordSplit, textSplit, variable, i;
        return __generator(this, function (_a) {
            debug("start notify sms");
            ami = ts_ami_1.Ami.localhost({ "user": _1.amiUser });
            name = dongle.name, number = dongle.number, provider = dongle.provider, imei = dongle.imei, imsi = dongle.imsi;
            keywordSplit = "SMS_BASE64_PART_";
            textSplit = ts_ami_1.Ami.base64TextSplit(message.text);
            variable = {
                "DONGLENAME": name,
                "DONGLEPROVIDER": provider,
                "DONGLEIMEI": imei,
                "DONGLEIMSI": imsi,
                "DONGLENUMBER": number,
                "SMS_NUMBER": message.number,
                "SMS_DATE": message.date.toISOString(),
                "SMS_TEXT_SPLIT_COUNT": "" + textSplit.length,
                "SMS_BASE64": textSplit[0]
            };
            for (i = 0; i < textSplit.length; i++)
                variable["" + keywordSplit + i] = textSplit[i];
            ami.originateLocalChannel(dialplanContext, "reassembled-sms", variable);
            return [2 /*return*/];
        });
    });
}
exports.notifySms = notifySms;
