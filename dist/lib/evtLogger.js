"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chan_dongle_extended_client_1 = require("chan-dongle-extended-client");
var _debug = require("debug");
var debug = _debug("_evtLogger");
var client = chan_dongle_extended_client_1.DongleExtendedClient.localhost();
var logger = function (evtName) {
    return function (data) { return debug(evtName + ": " + JSON.stringify(data, null, 2)); };
};
client.evtDongleDisconnect.attach(logger("evtDongleDisconnect"));
client.evtMessageStatusReport.attach(logger("evtMessageStatusReport"));
client.evtNewActiveDongle.attach(logger("evtNewActiveDongle"));
client.evtNewMessage.attach(logger("evtNewMessage"));
client.evtRequestUnlockCode.attach(logger("evtRequestUnlockCode"));
//# sourceMappingURL=evtLogger.js.map