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
var path = require("path");
var fs = require("fs");
var Astdirs;
(function (Astdirs) {
    Astdirs.dir_path = ".";
    Astdirs.phony = {
        "astetcdir": "",
        "astmoddir": "",
        "astvarlibdir": "",
        "astdbdir": "",
        "astkeydir": "",
        "astdatadir": "",
        "astagidir": "",
        "astspooldir": "",
        "astrundir": "",
        "astlogdir": "",
        "astsbindir": ""
    };
    var file_name = "astdirs.json";
    var instance = undefined;
    function set(asterisk_main_config_file_path) {
        var raw = fs.readFileSync(asterisk_main_config_file_path).toString("utf8");
        var astdirs = __assign({}, Astdirs.phony);
        for (var key in Astdirs.phony) {
            astdirs[key] = raw.match(new RegExp("^" + key + "[^/]+(/[^\\s]+)s*$", "m"))[1];
        }
        fs.writeFileSync(path.join(Astdirs.dir_path, file_name), Buffer.from(JSON.stringify(astdirs, null, 2), "utf8"));
        instance = astdirs;
    }
    Astdirs.set = set;
    function get() {
        if (!!instance) {
            return instance;
        }
        instance = JSON.parse(fs.readFileSync(path.join(Astdirs.dir_path, file_name)).toString("utf8"));
        return instance;
    }
    Astdirs.get = get;
})(Astdirs = exports.Astdirs || (exports.Astdirs = {}));
