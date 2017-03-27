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
var iniExt_1 = require("../tools/iniExt");
var fs_1 = require("fs");
require("colors");
var confPath = "/etc/asterisk/manager.conf";
;
var AmiCredential;
(function (AmiCredential) {
    function retrieve() {
        if (credential)
            return credential;
        return credential = init();
    }
    AmiCredential.retrieve = retrieve;
})(AmiCredential = exports.AmiCredential || (exports.AmiCredential = {}));
var credential = undefined;
function init() {
    var config = iniExt_1.ini.parseStripWhitespace(fs_1.readFileSync(confPath, "utf8"));
    var general = config.general || {};
    if (general.enabled !== "yes")
        throw new Error("Asterisk manager is not enabled");
    var port = general.port ? parseInt(general.port) : 5038;
    var host = (general.bindaddr && general.bindaddr !== "0.0.0.0") ? general.bindaddr : "127.0.0.1";
    delete config.general;
    var credential = undefined;
    for (var _i = 0, _a = Object.keys(config); _i < _a.length; _i++) {
        var userName = _a[_i];
        var userConfig = config[userName];
        if (!userConfig.secret ||
            !userConfig.write ||
            !userConfig.read)
            continue;
        if (isGranted(getListAuthority(userConfig.read)) &&
            isGranted(getListAuthority(userConfig.write))) {
            credential = { "user": userName, "secret": userConfig.secret };
            break;
        }
    }
    return __assign({}, credential, { port: port, host: host });
}
function getListAuthority(strList) {
    strList = strList.replace(/\ /g, "");
    return strList.split(",");
}
function isGranted(list) {
    var hasUser = false;
    var hasSystem = false;
    var hasConfig = false;
    for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
        var authority = list_1[_i];
        if (authority.toLowerCase() === "all")
            return true;
        if (authority.toLocaleLowerCase() === "user")
            hasUser = true;
        if (authority.toLocaleLowerCase() === "system")
            hasSystem = true;
        if (authority.toLocaleLowerCase() === "config")
            hasConfig = true;
    }
    return hasUser && (hasSystem || hasConfig);
}
//# sourceMappingURL=AmiCredential.js.map