"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_gsm_modem_1 = require("ts-gsm-modem");
var LockedModem;
(function (LockedModem) {
    function match(modem) {
        try {
            return !!modem.performUnlock;
        }
        catch (_a) {
            return false;
        }
    }
    LockedModem.match = match;
})(LockedModem = exports.LockedModem || (exports.LockedModem = {}));
function matchModem(modem) {
    return modem instanceof ts_gsm_modem_1.Modem;
}
exports.matchModem = matchModem;
