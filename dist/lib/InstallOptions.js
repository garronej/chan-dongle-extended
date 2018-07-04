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
var installer_1 = require("../bin/installer");
var InstallOptions;
(function (InstallOptions) {
    InstallOptions.file_path = path.join(installer_1.working_directory_path, "install_options.json");
    InstallOptions.defaults = {
        "asterisk_main_conf": "/etc/asterisk/asterisk.conf",
        "bind_addr": "127.0.0.1",
        "port": chan_dongle_extended_client_1.misc.port,
        "disable_sms_dialplan": false,
        "ast_include_dir_path": "/usr/include",
        "enable_ast_ami_on_port": 5038,
        "assume_chan_dongle_installed": false,
        "ld_library_path_for_asterisk": "",
        "do_not_create_systemd_conf": false,
        "unix_user": installer_1.unix_user_default
    };
    var _options = undefined;
    function set(options) {
        _options = {};
        for (var key in InstallOptions.defaults) {
            _options[key] = options[key];
        }
        fs.writeFileSync(InstallOptions.file_path, Buffer.from(JSON.stringify(_options, null, 2), "utf8"));
    }
    InstallOptions.set = set;
    function get() {
        if (!_options) {
            _options = require(InstallOptions.file_path);
        }
        var installOptions = __assign({}, InstallOptions.defaults);
        for (var key in InstallOptions.defaults) {
            if (_options[key] !== undefined) {
                installOptions[key] = _options[key];
            }
        }
        return installOptions;
    }
    InstallOptions.get = get;
    function getDeduced() {
        get();
        var o = _options;
        return {
            "assume_asterisk_installed": !!o.ast_include_dir_path || !!o.asterisk_main_conf || !!o.ld_library_path_for_asterisk,
            "overwrite_ami_port_if_enabled": o.enable_ast_ami_on_port !== undefined
        };
    }
    InstallOptions.getDeduced = getDeduced;
})(InstallOptions = exports.InstallOptions || (exports.InstallOptions = {}));
