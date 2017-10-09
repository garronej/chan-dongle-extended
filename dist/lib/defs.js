"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_gsm_modem_1 = require("ts-gsm-modem");
function matchLockedModem(modem) {
    try {
        return !!modem.performUnlock;
    }
    catch (_a) {
        return false;
    }
}
exports.matchLockedModem = matchLockedModem;
function matchModem(modem) {
    return modem instanceof ts_gsm_modem_1.Modem;
}
exports.matchModem = matchModem;
