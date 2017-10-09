"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
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
var chan_dongle_extended_client_1 = require("../chan-dongle-extended-client");
var lt = require("./defs");
var matchModem = lt.matchModem;
var chanDongleConfManager_1 = require("./chanDongleConfManager");
var _debug = require("debug");
var debug = _debug("_dialplan");
function start(modems, ami) {
    var configDefault = chanDongleConfManager_1.chanDongleConfManager.getConfig().defaults;
    var dialplanContext = configDefault.context;
    var defaultNumber = configDefault.exten;
    modems.evtCreate.attach(function (_a) {
        var _b = __read(_a, 2), modem = _b[0], accessPoint = _b[1];
        if (!matchModem(modem))
            return;
        var dongleVariables = {
            "DONGLENAME": accessPoint.friendlyId,
            "DONGLEPROVIDER": "" + modem.serviceProviderName,
            "DONGLEIMEI": modem.imei,
            "DONGLEIMSI": modem.imsi,
            "DONGLENUMBER": modem.number || defaultNumber
        };
        modem.evtMessage.attach(function (message) {
            debug("Notify Message");
            var textSplit = chan_dongle_extended_client_1.Ami.b64.split(message.text);
            var variables = __assign({}, dongleVariables, { "SMS_NUMBER": message.number, "SMS_DATE": message.date.toISOString(), "SMS_TEXT_SPLIT_COUNT": "" + textSplit.length, "SMS_BASE64": chan_dongle_extended_client_1.Ami.b64.crop(message.text) });
            for (var i = 0; i < textSplit.length; i++)
                variables["SMS_BASE64_PART_" + i] = textSplit[i];
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
exports.start = start;
