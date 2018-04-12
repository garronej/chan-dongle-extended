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
var chan_dongle_extended_client_1 = require("../chan-dongle-extended-client");
var Locals;
(function (Locals) {
    Locals.defaults = {
        "service_name": "dongle",
        "astetcdir": "/etc/asterisk",
        "bind_addr": "127.0.0.1",
        "port": chan_dongle_extended_client_1.misc.port,
        "ami_port": 5038,
        "disable_sms_dialplan": false,
        "build_across_linux_kernel": null,
        "ast_include_dir_path": "/usr/include/",
        "assume_chan_dongle_installed": false
    };
})(Locals = exports.Locals || (exports.Locals = {}));
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
})(Astdirs = exports.Astdirs || (exports.Astdirs = {}));
exports.file_name = "locals.json";
function get(dir_path) {
    if (dir_path === void 0) { dir_path = "."; }
    if (!!get.instance) {
        return get.instance;
    }
    var locals = JSON.parse(fs.readFileSync(path.join(dir_path, exports.file_name)).toString("utf8"));
    var astdirs = get.readAstdirs(locals.astetcdir);
    return get.instance = { locals: locals, astdirs: astdirs };
}
exports.get = get;
(function (get) {
    get.instance = undefined;
    function readAstdirs(astetcdir) {
        var text = fs.readFileSync(path.join(astetcdir, "asterisk.conf")).toString("utf8");
        var astdirs = __assign({}, Astdirs.phony);
        for (var key in Astdirs.phony) {
            astdirs[key] = text.match(new RegExp("^" + key + "[^/]+(/[^\\s]+)s*$", "m"))[1];
        }
        return astdirs;
    }
    get.readAstdirs = readAstdirs;
})(get = exports.get || (exports.get = {}));
