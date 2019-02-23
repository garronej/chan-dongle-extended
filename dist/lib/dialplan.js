"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var ts_ami_1 = require("ts-ami");
var tt = require("transfer-tools");
var types = require("./types");
var logger = require("logger");
var debug = logger.debugFactory();
function init(modems, ami, dialplanContext, defaultNumber) {
    modems.evtCreate.attach(function (_a) {
        var _b = __read(_a, 2), modem = _b[0], accessPoint = _b[1];
        if (!types.matchModem(modem)) {
            return;
        }
        var dongleVariables = {
            "DONGLENAME": accessPoint.friendlyId,
            "DONGLEPROVIDER": "" + modem.serviceProviderName,
            "DONGLEIMEI": modem.imei,
            "DONGLEIMSI": modem.imsi,
            "DONGLENUMBER": modem.number || defaultNumber
        };
        modem.evtMessage.attach(function (message) {
            debug("Notify Message");
            var textSplit = tt.stringTransform.textSplit(ts_ami_1.Ami.headerValueMaxLength, tt.stringTransform.safeBufferFromTo(message.text, "utf8", "base64"));
            var variables = __assign({}, dongleVariables, { "SMS_NUMBER": message.number, "SMS_DATE": message.date.toISOString(), "SMS_TEXT_SPLIT_COUNT": "" + textSplit.length, "SMS_BASE64": tt.stringTransformExt.b64crop(ts_ami_1.Ami.headerValueMaxLength, message.text) });
            for (var i = 0; i < textSplit.length; i++) {
                variables["SMS_BASE64_PART_" + i] = textSplit[i];
            }
            ami.originateLocalChannel(dialplanContext, "reassembled-sms", variables);
        });
        modem.evtMessageStatusReport.attach(function (statusReport) {
            debug("Notify status report");
            var dischargeDate = statusReport.dischargeDate, isDelivered = statusReport.isDelivered, sendDate = statusReport.sendDate, status = statusReport.status, recipient = statusReport.recipient;
            var variable = __assign({}, dongleVariables, { "STATUS_REPORT_DISCHARGE_TIME": isNaN(dischargeDate.getTime()) ? "" + dischargeDate : dischargeDate.toISOString(), "STATUS_REPORT_IS_DELIVERED": "" + isDelivered, "STATUS_REPORT_SEND_TIME": "" + sendDate.getTime(), "STATUS_REPORT_STATUS": status, "STATUS_REPORT_RECIPIENT": recipient });
            ami.originateLocalChannel(dialplanContext, "sms-status-report", variable);
        });
    });
}
exports.init = init;
