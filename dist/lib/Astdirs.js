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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Astdirs = void 0;
var path = require("path");
var fs = require("fs");
var installer_1 = require("../bin/installer");
var Astdirs;
(function (Astdirs) {
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
    var file_path = path.join(installer_1.working_directory_path, "astdirs.json");
    var instance = undefined;
    function set(asterisk_main_config_file_path) {
        var astdirs = getStatic(asterisk_main_config_file_path);
        fs.writeFileSync(file_path, Buffer.from(JSON.stringify(astdirs, null, 2), "utf8"));
        instance = astdirs;
    }
    Astdirs.set = set;
    function getStatic(asterisk_main_config_file_path) {
        var raw = fs.readFileSync(asterisk_main_config_file_path).toString("utf8");
        var astdirs = __assign({}, Astdirs.phony);
        for (var key in Astdirs.phony) {
            astdirs[key] = raw.match(new RegExp("^" + key + "[^/]+(/[^\\s]+)s*$", "m"))[1];
        }
        return astdirs;
    }
    Astdirs.getStatic = getStatic;
    function get() {
        if (!!instance) {
            return instance;
        }
        instance = require(file_path);
        return get();
    }
    Astdirs.get = get;
})(Astdirs = exports.Astdirs || (exports.Astdirs = {}));
