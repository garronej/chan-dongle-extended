"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var iniSource = require("ini");
exports.ini = __assign({}, iniSource, { parseStripWhitespace: (function (initString) { return makeSafeConfig(iniSource.parse(initString)); }) });
function makeSafeConfig(config) {
    for (var _i = 0, _a = Object.keys(config); _i < _a.length; _i++) {
        var key = _a[_i];
        switch (typeof config[key]) {
            case "string":
                config[key] = config[key].replace(/\ +$/, "");
                break;
            case "object":
                makeSafeConfig(config[key]);
                break;
        }
    }
    return config;
}
//# sourceMappingURL=iniExt.js.map