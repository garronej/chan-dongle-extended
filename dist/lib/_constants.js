"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var config = require("../../config.json");
exports.serviceName = config["service-name"];
exports.user = config["user"];
exports.group = config["group"];
var paths;
(function (paths) {
    var dirs;
    (function (dirs) {
        dirs.project = path_1.join(__dirname, "..", "..");
        dirs.persist = path_1.join(dirs.project, ".node-persist");
        dirs.asterisk = config["paths"]["asterisk"];
    })(dirs = paths.dirs || (paths.dirs = {}));
    var files;
    (function (files) {
        files.systemdServiceFile = path_1.join(config["paths"]["systemd"], exports.serviceName + ".service");
        files.udevRules = path_1.join(config["paths"]["udev"], "99-" + exports.serviceName + ".rules");
    })(files = paths.files || (paths.files = {}));
})(paths = exports.paths || (exports.paths = {}));
exports.tty0ttyPairCount = config["tty0tty-pair-count"];
exports.disableSmsDialplan = config["disable-sms-dialplan"];
