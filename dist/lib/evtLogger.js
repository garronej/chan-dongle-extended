"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chan_dongle_extended_client_1 = require("chan-dongle-extended-client");
var _debug = require("debug");
var debug = _debug("_evtLogger");
var amiClient = chan_dongle_extended_client_1.AmiClient.localhost();
var logger = function (evtName) {
    return function (data) { return debug(evtName + ": " + JSON.stringify(data, null, 2)); };
};
amiClient.evtDongleDisconnect.attach(logger("evtDongleDisconnect"));
amiClient.evtMessageStatusReport.attach(logger("evtMessageStatusReport"));
amiClient.evtNewActiveDongle.attach(logger("evtNewActiveDongle"));
amiClient.evtNewMessage.attach(logger("evtNewMessage"));
amiClient.evtRequestUnlockCode.attach(logger("evtRequestUnlockCode"));
//# sourceMappingURL=evtLogger.js.map