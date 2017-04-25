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
Object.defineProperty(exports, "__esModule", { value: true });
var ts_exec_queue_1 = require("ts-exec-queue");
var chan_dongle_extended_client_1 = require("chan-dongle-extended-client");
var ChanDongleConfManager_1 = require("./ChanDongleConfManager");
var dialplanContext = ChanDongleConfManager_1.ChanDongleConfManager.getConfig().defaults.context;
var smsExtension = "reassembled-sms";
var smsStatusReportExtension = "sms-status-report";
var Dialplan;
(function (Dialplan) {
    var _this = this;
    var cluster = {};
    Dialplan.notifyStatusReport = ts_exec_queue_1.execQueue(cluster, "WRITE", function (dongle, statusReport, callback) { return __awaiter(_this, void 0, void 0, function () {
        var name, number, provider, imei, imsi, assignations, dischargeTime, isDelivered, messageId, status, recipient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    name = dongle.name, number = dongle.number, provider = dongle.provider, imei = dongle.imei, imsi = dongle.imsi;
                    assignations = [
                        "CALLERID(name)=" + name,
                        "DONGLENAME=" + name,
                        "DONGLEPROVIDER=" + provider,
                        "DONGLEIMEI=" + imei,
                        "DONGLEIMSI=" + imsi,
                        "DONGLENUMBER=" + number
                    ];
                    dischargeTime = statusReport.dischargeTime, isDelivered = statusReport.isDelivered, messageId = statusReport.messageId, status = statusReport.status, recipient = statusReport.recipient;
                    assignations = assignations.concat([
                        "STATUS_REPORT_DISCHARGE_TIME=" + dischargeTime.toISOString(),
                        "STATUS_REPORT_IS_DELIVERED=" + isDelivered,
                        "STATUS_REPORT_ID=" + messageId,
                        "STATUS_REPORT_STATUS=" + status,
                        "STATUS_REPORT_RECIPIENT=" + recipient
                    ]);
                    return [4 /*yield*/, assignAndOriginate(assignations, smsStatusReportExtension)];
                case 1:
                    _a.sent();
                    callback();
                    return [2 /*return*/];
            }
        });
    }); });
    Dialplan.notifySms = ts_exec_queue_1.execQueue(cluster, "NOTIFY_SMS", function (dongle, message, callback) { return __awaiter(_this, void 0, void 0, function () {
        var name, number, provider, imei, imsi, assignations, text, textSplit, i, truncatedText, textTruncatedSplit, _i, textTruncatedSplit_1, part;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    name = dongle.name, number = dongle.number, provider = dongle.provider, imei = dongle.imei, imsi = dongle.imsi;
                    assignations = [
                        "CALLERID(name)=" + name,
                        "DONGLENAME=" + name,
                        "DONGLEPROVIDER=" + provider,
                        "DONGLEIMEI=" + imei,
                        "DONGLEIMSI=" + imsi,
                        "DONGLENUMBER=" + number
                    ];
                    assignations = assignations.concat([
                        "CALLERID(num)=" + message.number,
                        "CALLERID(ani)=" + message.number,
                        "SMS_NUMBER=" + message.number,
                        "SMS_DATE=" + message.date.toISOString()
                    ]);
                    text = message.text;
                    textSplit = chan_dongle_extended_client_1.strDivide(200, encodeURI(text));
                    assignations.push("SMS_TEXT_SPLIT_COUNT=" + textSplit.length);
                    for (i = 0; i < textSplit.length; i++)
                        assignations.push("SMS_TEXT_P" + i + "=" + textSplit[i]);
                    truncatedText = text.substring(0, 2048);
                    if (truncatedText.length < text.length)
                        truncatedText += " [ truncated ]";
                    textTruncatedSplit = chan_dongle_extended_client_1.strDivide(200, encodeURI(truncatedText));
                    assignations.push("SMS_URI_ENCODED=" + textTruncatedSplit.shift());
                    for (_i = 0, textTruncatedSplit_1 = textTruncatedSplit; _i < textTruncatedSplit_1.length; _i++) {
                        part = textTruncatedSplit_1[_i];
                        assignations.push("SMS_URI_ENCODED=${SMS_URI_ENCODED}" + part);
                    }
                    assignations.push("SMS=" + JSON.stringify(text.substring(0, 200)));
                    return [4 /*yield*/, assignAndOriginate(assignations, smsExtension)];
                case 1:
                    _a.sent();
                    callback();
                    return [2 /*return*/];
            }
        });
    }); });
})(Dialplan = exports.Dialplan || (exports.Dialplan = {}));
function assignAndOriginate(assignations, gotoExtension) {
    return __awaiter(this, void 0, void 0, function () {
        var ami, priority, initExtension, _i, assignations_1, assignation;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ami = chan_dongle_extended_client_1.DongleExtendedClient.localhost().ami;
                    priority = 1;
                    initExtension = "init-" + gotoExtension;
                    return [4 /*yield*/, ami.addDialplanExtension(initExtension, priority++, "Answer()", dialplanContext)];
                case 1:
                    _a.sent();
                    _i = 0, assignations_1 = assignations;
                    _a.label = 2;
                case 2:
                    if (!(_i < assignations_1.length)) return [3 /*break*/, 5];
                    assignation = assignations_1[_i];
                    return [4 /*yield*/, ami.addDialplanExtension(initExtension, priority++, "Set(" + assignation + ")", dialplanContext)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, ami.addDialplanExtension(initExtension, priority++, "GoTo(" + gotoExtension + ",1)", dialplanContext)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, ami.originateLocalChannel(dialplanContext, initExtension)];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
//# sourceMappingURL=Dialplan.js.map