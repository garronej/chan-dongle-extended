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
var InstallOptions;
(function (InstallOptions) {
    InstallOptions.dir_path = ".";
    InstallOptions.file_name = "install_options.json";
    InstallOptions.defaults = {
        "asterisk_main_conf": "/etc/asterisk/asterisk.conf",
        "bind_addr": "127.0.0.1",
        "port": chan_dongle_extended_client_1.misc.port,
        "disable_sms_dialplan": false,
        "ast_include_dir_path": "/usr/include",
        "enable_ast_ami_on_port": 5038,
        "assume_asterisk_installed": false,
        "assume_chan_dongle_installed": false,
        "ld_library_path_for_asterisk": ""
    };
    var instance = undefined;
    function set(options) {
        var installOptions = __assign({}, InstallOptions.defaults);
        for (var key in InstallOptions.defaults) {
            if (options[key] !== undefined) {
                installOptions[key] = options[key];
            }
        }
        fs.writeFileSync(path.join(InstallOptions.dir_path, InstallOptions.file_name), Buffer.from(JSON.stringify(installOptions, null, 2), "utf8"));
        instance = installOptions;
    }
    InstallOptions.set = set;
    function get() {
        if (!!instance) {
            return instance;
        }
        instance = JSON.parse(fs.readFileSync(path.join(InstallOptions.dir_path, InstallOptions.file_name)).toString("utf8"));
        return instance;
    }
    InstallOptions.get = get;
})(InstallOptions = exports.InstallOptions || (exports.InstallOptions = {}));
