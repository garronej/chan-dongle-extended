"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var _chan_dongle_extended_client_1 = require("../_chan-dongle-extended-client");
var _debug = require("debug");
var debug = _debug("_evtLogger");
var client = _chan_dongle_extended_client_1.DongleExtendedClient.localhost();
var _loop_1 = function (evtName) {
    if (!evtName.match(/^evt/))
        return "continue";
    debug("displaying event: " + evtName);
    client[evtName].attach(function (data) { return debug(evtName + ": " + JSON.stringify(data, null, 2)); });
};
try {
    for (var _a = __values(Object.keys(client)), _b = _a.next(); !_b.done; _b = _a.next()) {
        var evtName = _b.value;
        _loop_1(evtName);
    }
}
catch (e_1_1) { e_1 = { error: e_1_1 }; }
finally {
    try {
        if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
    }
    finally { if (e_1) throw e_1.error; }
}
var e_1, _c;
