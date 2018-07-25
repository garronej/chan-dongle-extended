"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
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
var child_process = require("child_process");
var fs = require("fs");
var path = require("path");
var scriptLib = require("scripting-tools");
var readline = require("readline");
var ini_extended_1 = require("ini-extended");
exports.unix_user_default = "chan_dongle";
exports.srv_name = "chan_dongle";
var module_dir_path = path.join(__dirname, "..", "..");
var cli_js_path = path.join(__dirname, "cli.js");
exports.working_directory_path = path.join(module_dir_path, "working_directory");
exports.node_path = path.join(module_dir_path, "node");
var installed_pkg_record_path = path.join(module_dir_path, "pkg_installed.json");
exports.pidfile_path = path.join(exports.working_directory_path, "pid");
var uninstaller_link_default_path = "/usr/sbin/dongle_uninstaller";
exports.db_path = path.join(exports.working_directory_path, "app.db");
var to_distribute_rel_paths = [
    "LICENSE",
    "README.md",
    "res/" + path.basename(exports.db_path),
    "dist",
    "node_modules",
    "package.json",
    path.basename(exports.node_path)
];
//Must be after declaration of working_directory_path and unix_user
var InstallOptions_1 = require("../lib/InstallOptions");
var Astdirs_1 = require("../lib/Astdirs");
var AmiCredential_1 = require("../lib/AmiCredential");
function getIsProd() {
    if (getIsProd.value !== undefined) {
        return getIsProd.value;
    }
    getIsProd.value = !fs.existsSync(path.join(module_dir_path, ".git"));
    return getIsProd();
}
exports.getIsProd = getIsProd;
(function (getIsProd) {
    getIsProd.value = undefined;
})(getIsProd = exports.getIsProd || (exports.getIsProd = {}));
function program_action_install(options) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, message;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("---Installing " + exports.srv_name + "---");
                    if (fs.existsSync(uninstaller_link_default_path) &&
                        path.dirname(scriptLib.sh_eval("readlink -f " + uninstaller_link_default_path)) !== exports.working_directory_path) {
                        process.stdout.write(scriptLib.colorize("Uninstalling previous instal found in other location... ", "YELLOW"));
                        scriptLib.execSync(uninstaller_link_default_path + " run");
                        console.log(scriptLib.colorize("DONE", "GREEN"));
                    }
                    uninstall();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, install(options)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    message = _a.message;
                    console.log(scriptLib.colorize("An error occurred: '" + message, "RED"));
                    uninstall();
                    if (getIsProd()) {
                        scriptLib.execSync("rm -r " + module_dir_path);
                    }
                    process.exit(-1);
                    return [2 /*return*/];
                case 4:
                    console.log("---DONE---");
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    });
}
function program_action_uninstall() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            console.log("---Uninstalling " + exports.srv_name + "---");
            uninstall("VERBOSE");
            console.log("---DONE---");
            if (fs.existsSync(installed_pkg_record_path)) {
                console.log([
                    "NOTE: Some packages have been installed automatically, ",
                    "you can remove them if you no longer need them.",
                    "\n",
                    "$ sudo apt-get purge " + require(installed_pkg_record_path).join(" "),
                    "\n",
                    "$ sudo apt-get --purge autoremove"
                ].join(""));
            }
            process.exit(0);
            return [2 /*return*/];
        });
    });
}
function program_action_update(options) {
    return __awaiter(this, void 0, void 0, function () {
        var e_1, _a, _module_dir_path, _b, db_schema_path, _db_schema_path, _c, node_python_messaging_dir_path, _node_python_messaging_dir_path, _d, udev_dir_path, _udev_dir_path, to_distribute_rel_paths_1, to_distribute_rel_paths_1_1, name;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (!getIsProd()) {
                        console.log(scriptLib.colorize("Should not update prod", "RED"));
                        process.exit(1);
                    }
                    scriptLib.stopProcessSync(exports.pidfile_path, "SIGUSR2");
                    scriptLib.enableCmdTrace();
                    _module_dir_path = options["path"];
                    _b = __read([module_dir_path, _module_dir_path].map(function (v) { return path.join(v, "res", path.basename(exports.db_path)); }), 2), db_schema_path = _b[0], _db_schema_path = _b[1];
                    if (!scriptLib.fs_areSame(db_schema_path, _db_schema_path)) {
                        scriptLib.fs_move("COPY", _db_schema_path, exports.db_path);
                    }
                    _c = __read([module_dir_path, _module_dir_path].map(function (v) { return scriptLib.find_module_path("node-python-messaging", v); }), 2), node_python_messaging_dir_path = _c[0], _node_python_messaging_dir_path = _c[1];
                    if (path.relative(module_dir_path, node_python_messaging_dir_path)
                        ===
                            path.relative(_module_dir_path, _node_python_messaging_dir_path)) {
                        scriptLib.fs_move("MOVE", node_python_messaging_dir_path, _node_python_messaging_dir_path);
                    }
                    if (scriptLib.fs_areSame(exports.node_path, path.join(_module_dir_path, path.basename(exports.node_path)))) {
                        _d = __read([module_dir_path, _module_dir_path].map(function (v) { return scriptLib.find_module_path("udev", v); }), 2), udev_dir_path = _d[0], _udev_dir_path = _d[1];
                        scriptLib.fs_move("MOVE", udev_dir_path, _udev_dir_path);
                    }
                    try {
                        for (to_distribute_rel_paths_1 = __values(to_distribute_rel_paths), to_distribute_rel_paths_1_1 = to_distribute_rel_paths_1.next(); !to_distribute_rel_paths_1_1.done; to_distribute_rel_paths_1_1 = to_distribute_rel_paths_1.next()) {
                            name = to_distribute_rel_paths_1_1.value;
                            scriptLib.fs_move("MOVE", _module_dir_path, module_dir_path, name);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (to_distribute_rel_paths_1_1 && !to_distribute_rel_paths_1_1.done && (_a = to_distribute_rel_paths_1.return)) _a.call(to_distribute_rel_paths_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    return [4 /*yield*/, rebuild_node_modules()];
                case 1:
                    _e.sent();
                    if (!InstallOptions_1.InstallOptions.get().do_not_create_systemd_conf) {
                        scriptLib.execSync("systemctl start " + exports.srv_name);
                    }
                    console.log(scriptLib.colorize("Update success", "GREEN"));
                    return [2 /*return*/];
            }
        });
    });
}
function program_action_tarball() {
    return __awaiter(this, void 0, void 0, function () {
        var e_2, _a, e_3, _b, _module_dir_path, to_distribute_rel_paths_2, to_distribute_rel_paths_2_1, name, _node_modules_path, _c, _d, name;
        return __generator(this, function (_e) {
            if (!fs.existsSync(exports.node_path)) {
                throw new Error("Missing node");
            }
            scriptLib.enableCmdTrace();
            _module_dir_path = path.join("/tmp", path.basename(module_dir_path));
            scriptLib.execSyncTrace("rm -rf " + _module_dir_path);
            try {
                for (to_distribute_rel_paths_2 = __values(to_distribute_rel_paths), to_distribute_rel_paths_2_1 = to_distribute_rel_paths_2.next(); !to_distribute_rel_paths_2_1.done; to_distribute_rel_paths_2_1 = to_distribute_rel_paths_2.next()) {
                    name = to_distribute_rel_paths_2_1.value;
                    scriptLib.fs_move("COPY", module_dir_path, _module_dir_path, name);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (to_distribute_rel_paths_2_1 && !to_distribute_rel_paths_2_1.done && (_a = to_distribute_rel_paths_2.return)) _a.call(to_distribute_rel_paths_2);
                }
                finally { if (e_2) throw e_2.error; }
            }
            _node_modules_path = path.join(_module_dir_path, "node_modules");
            try {
                for (_c = __values(["@types", "typescript"]), _d = _c.next(); !_d.done; _d = _c.next()) {
                    name = _d.value;
                    scriptLib.execSyncTrace("rm -r " + path.join(_node_modules_path, name));
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                }
                finally { if (e_3) throw e_3.error; }
            }
            scriptLib.execSyncTrace([
                "rm -r",
                path.join(scriptLib.find_module_path("node-python-messaging", _module_dir_path), "dist", "virtual"),
                path.join(scriptLib.find_module_path("udev", _module_dir_path), "build")
            ].join(" "));
            scriptLib.execSyncTrace("find " + _node_modules_path + " -type f -name \"*.ts\" -exec rm -rf {} \\;");
            (function hide_auth_token() {
                var e_4, _a;
                var files = scriptLib.execSync("find . -name \"package-lock.json\" -o -name \"package.json\"", { "cwd": _module_dir_path })
                    .slice(0, -1)
                    .split("\n")
                    .map(function (rp) { return path.join(_module_dir_path, rp); });
                try {
                    for (var files_1 = __values(files), files_1_1 = files_1.next(); !files_1_1.done; files_1_1 = files_1.next()) {
                        var file = files_1_1.value;
                        fs.writeFileSync(file, Buffer.from(fs.readFileSync(file)
                            .toString("utf8")
                            .replace(/[0-9a-f]+:x-oauth-basic/g, "xxxxxxxxxxxxxxxx"), "utf8"));
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (files_1_1 && !files_1_1.done && (_a = files_1.return)) _a.call(files_1);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            })();
            scriptLib.execSyncTrace([
                "tar -czf",
                path.join(module_dir_path, "dongle_" + scriptLib.sh_eval("uname -m") + ".tar.gz"),
                "-C " + _module_dir_path + " ."
            ].join(" "));
            scriptLib.execSyncTrace("rm -r " + _module_dir_path);
            console.log("---DONE---");
            return [2 /*return*/];
        });
    });
}
function install(options) {
    return __awaiter(this, void 0, void 0, function () {
        var unix_user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    scriptLib.execSync("mkdir " + exports.working_directory_path);
                    InstallOptions_1.InstallOptions.set(options);
                    unix_user = InstallOptions_1.InstallOptions.get().unix_user;
                    if (unix_user === exports.unix_user_default) {
                        scriptLib.unixUser.create(unix_user, exports.working_directory_path);
                    }
                    else {
                        if (!scriptLib.sh_if("id -u " + unix_user)) {
                            throw new Error("Unix user " + unix_user + " does not exist");
                        }
                    }
                    scriptLib.execSync("chown " + unix_user + ":" + unix_user + " " + exports.working_directory_path);
                    if (!getIsProd()) return [3 /*break*/, 3];
                    return [4 /*yield*/, install_prereq()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, rebuild_node_modules()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    if (!fs.existsSync(exports.node_path)) {
                        throw new Error(exports.node_path + " is missing");
                    }
                    scriptLib.enableCmdTrace();
                    _a.label = 4;
                case 4:
                    if (!!InstallOptions_1.InstallOptions.getDeduced().assume_asterisk_installed) return [3 /*break*/, 6];
                    return [4 /*yield*/, apt_get_install_asterisk()];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    Astdirs_1.Astdirs.set(InstallOptions_1.InstallOptions.get().asterisk_main_conf);
                    modemManager.disable_and_stop();
                    return [4 /*yield*/, tty0tty.install()];
                case 7:
                    _a.sent();
                    if (!InstallOptions_1.InstallOptions.get().assume_chan_dongle_installed) return [3 /*break*/, 8];
                    chan_dongle.linkDongleConfigFile();
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, chan_dongle.install()];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10: return [4 /*yield*/, udevRules.create()];
                case 11:
                    _a.sent();
                    shellScripts.create();
                    asterisk_manager.enable();
                    scriptLib.execSync("cp " + path.join(module_dir_path, "res", path.basename(exports.db_path)) + " " + exports.db_path, { "uid": scriptLib.get_uid(unix_user), "gid": scriptLib.get_gid(unix_user) });
                    if (!InstallOptions_1.InstallOptions.get().do_not_create_systemd_conf) {
                        scriptLib.systemd.createConfigFile(exports.srv_name, path.join(__dirname, "main.js"), exports.node_path, "ENABLE", "START");
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function uninstall(verbose) {
    var _this = this;
    if (verbose === void 0) { verbose = false; }
    var write = !!verbose ? process.stdout.write.bind(process.stdout) : (function () { });
    var log = function (str) { return write(str + "\n"); };
    var runRecover = function (description, action) { return __awaiter(_this, void 0, void 0, function () {
        var message;
        return __generator(this, function (_a) {
            write(description);
            try {
                action();
            }
            catch (_b) {
                message = _b.message;
                log(scriptLib.colorize(message, "RED"));
            }
            log(scriptLib.colorize("ok", "GREEN"));
            return [2 /*return*/];
        });
    }); };
    runRecover("Stopping running instance ... ", function () { return scriptLib.stopProcessSync(exports.pidfile_path, "SIGUSR2"); });
    runRecover("Removing systemd config file ... ", function () { return scriptLib.systemd.deleteConfigFile(exports.srv_name); });
    runRecover("Uninstalling chan_dongle.so ... ", function () { return chan_dongle.remove(); });
    runRecover("Restoring asterisk manager ... ", function () { return asterisk_manager.restore(); });
    runRecover("Removing binary symbolic links ... ", function () { return shellScripts.remove_symbolic_links(); });
    runRecover("Removing udev rules ... ", function () { return udevRules.remove(); });
    runRecover("Removing tty0tty kernel module ...", function () { return tty0tty.remove(); });
    runRecover("Removing app working directory ... ", function () { return scriptLib.execSyncQuiet("rm -r " + exports.working_directory_path); });
    runRecover("Deleting " + exports.unix_user_default + " unix user ... ", function () { return scriptLib.unixUser.remove(exports.unix_user_default); });
    runRecover("Re enabling ModemManager if present...", function () { return modemManager.enable_and_start(); });
}
var tty0tty;
(function (tty0tty) {
    var h_dir_path = path.join(exports.working_directory_path, "linux-headers");
    var build_link_path = "/lib/modules/$(uname -r)/build";
    function remove_local_linux_headers() {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, scriptLib.exec("rm -r " + h_dir_path)];
                    case 1:
                        _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/];
                    case 3:
                        scriptLib.execSync("rm " + build_link_path);
                        return [2 /*return*/];
                }
            });
        });
    }
    function install_linux_headers() {
        return __awaiter(this, void 0, void 0, function () {
            var kernel_release, is_raspbian_host, h_deb_path, web_get, downloaded_from;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        kernel_release = scriptLib.execSync("uname -r").replace(/\n$/, "");
                        process.stdout.write("Checking for linux kernel headers ...");
                        if (fs.existsSync(path.join(build_link_path, "include"))) {
                            console.log("found. " + scriptLib.colorize("OK", "GREEN"));
                            return [2 /*return*/];
                        }
                        readline.clearLine(process.stdout, 0);
                        process.stdout.write("\r");
                        is_raspbian_host = !!scriptLib.execSync("cat /etc/os-release").match(/^NAME=.*Raspbian.*$/m);
                        if (!!is_raspbian_host) return [3 /*break*/, 2];
                        return [4 /*yield*/, scriptLib.apt_get_install_if_missing("linux-headers-$(uname -r)")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                    case 2:
                        h_deb_path = path.join(exports.working_directory_path, "linux-headers.deb");
                        web_get = function (url) { return __awaiter(_this, void 0, void 0, function () {
                            var attemptRemaining, e_5, error, error_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        attemptRemaining = 10;
                                        _a.label = 1;
                                    case 1:
                                        if (!true) return [3 /*break*/, 9];
                                        attemptRemaining--;
                                        _a.label = 2;
                                    case 2:
                                        _a.trys.push([2, 4, , 8]);
                                        return [4 /*yield*/, scriptLib.web_get(url, h_deb_path)];
                                    case 3:
                                        _a.sent();
                                        return [3 /*break*/, 8];
                                    case 4:
                                        e_5 = _a.sent();
                                        error = e_5;
                                        if (!(attemptRemaining !== 0)) return [3 /*break*/, 6];
                                        if (error.cause === "HTTP ERROR CODE") {
                                            error_1 = e_5;
                                            if (error_1.code !== 503) {
                                                throw error_1;
                                            }
                                        }
                                        console.log("Fail downloading " + url + " " + error.message + ", retrying");
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
                                    case 5:
                                        _a.sent();
                                        return [3 /*break*/, 1];
                                    case 6: throw error;
                                    case 7: return [3 /*break*/, 8];
                                    case 8: return [3 /*break*/, 9];
                                    case 9: return [2 /*return*/];
                                }
                            });
                        }); };
                        return [4 /*yield*/, (function download_deb() {
                                return __awaiter(this, void 0, void 0, function () {
                                    var _a, onError, onSuccess, firmware_release, url, _b, url, _c;
                                    return __generator(this, function (_d) {
                                        switch (_d.label) {
                                            case 0:
                                                _a = scriptLib.start_long_running_process("Downloading raspberrypi linux headers"), onError = _a.onError, onSuccess = _a.onSuccess;
                                                _d.label = 1;
                                            case 1:
                                                _d.trys.push([1, 3, , 8]);
                                                firmware_release = scriptLib.execSync("zcat /usr/share/doc/raspberrypi-bootloader/changelog.Debian.gz | head")
                                                    .match(/^[^r]*raspberrypi-firmware\ \(([^\)]+)\)/)[1];
                                                url = [
                                                    "https://archive.raspberrypi.org/debian/pool/main/r/raspberrypi-firmware/",
                                                    "raspberrypi-kernel-headers_" + firmware_release + "_armhf.deb"
                                                ].join("");
                                                return [4 /*yield*/, web_get(url)];
                                            case 2:
                                                _d.sent();
                                                downloaded_from = "OFFICIAL";
                                                return [3 /*break*/, 8];
                                            case 3:
                                                _b = _d.sent();
                                                _d.label = 4;
                                            case 4:
                                                _d.trys.push([4, 6, , 7]);
                                                url = [
                                                    "https://www.niksula.hut.fi/~mhiienka/Rpi/linux-headers-rpi" + (kernel_release[0] === "3" ? "/3.x.x/" : "/"),
                                                    "linux-headers-" + kernel_release + "_" + kernel_release + "-2_armhf.deb"
                                                ].join("");
                                                return [4 /*yield*/, web_get(url)];
                                            case 5:
                                                _d.sent();
                                                downloaded_from = "MHIIENKA";
                                                return [3 /*break*/, 7];
                                            case 6:
                                                _c = _d.sent();
                                                onError("linux-kernel headers for raspberry pi not found");
                                                throw new Error();
                                            case 7: return [3 /*break*/, 8];
                                            case 8:
                                                onSuccess("DONE");
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            }())];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, (function install_deb() {
                                return __awaiter(this, void 0, void 0, function () {
                                    var e_6, _a, _b, _c, pkg_name, e_6_1, _d, exec, onSuccess, build_dir_path;
                                    return __generator(this, function (_e) {
                                        switch (_e.label) {
                                            case 0:
                                                if (!(downloaded_from === "MHIIENKA")) return [3 /*break*/, 8];
                                                _e.label = 1;
                                            case 1:
                                                _e.trys.push([1, 6, 7, 8]);
                                                _b = __values(["gcc-4.7", "bc", "dkms"]), _c = _b.next();
                                                _e.label = 2;
                                            case 2:
                                                if (!!_c.done) return [3 /*break*/, 5];
                                                pkg_name = _c.value;
                                                return [4 /*yield*/, scriptLib.apt_get_install(pkg_name)];
                                            case 3:
                                                _e.sent();
                                                _e.label = 4;
                                            case 4:
                                                _c = _b.next();
                                                return [3 /*break*/, 2];
                                            case 5: return [3 /*break*/, 8];
                                            case 6:
                                                e_6_1 = _e.sent();
                                                e_6 = { error: e_6_1 };
                                                return [3 /*break*/, 8];
                                            case 7:
                                                try {
                                                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                                                }
                                                finally { if (e_6) throw e_6.error; }
                                                return [7 /*endfinally*/];
                                            case 8:
                                                _d = scriptLib.start_long_running_process("Installing linux headers"), exec = _d.exec, onSuccess = _d.onSuccess;
                                                if (!(downloaded_from === "OFFICIAL")) return [3 /*break*/, 11];
                                                return [4 /*yield*/, exec("dpkg -x " + h_deb_path + " " + h_dir_path)];
                                            case 9:
                                                _e.sent();
                                                return [4 /*yield*/, exec("rm " + h_deb_path)];
                                            case 10:
                                                _e.sent();
                                                build_dir_path = path.join(h_dir_path, "usr", "src", "linux-headers-" + kernel_release);
                                                //Suppress the source for the other version (+v7)
                                                scriptLib.execSyncQuiet("mv " + path.join(h_dir_path, "usr", "src", kernel_release) + " " + build_dir_path + " || true");
                                                scriptLib.execSync("ln -sf " + build_dir_path + " " + build_link_path);
                                                return [3 /*break*/, 14];
                                            case 11: return [4 /*yield*/, exec("dpkg -i " + h_deb_path)];
                                            case 12:
                                                _e.sent();
                                                return [4 /*yield*/, exec("rm " + h_deb_path)];
                                            case 13:
                                                _e.sent();
                                                _e.label = 14;
                                            case 14:
                                                onSuccess("DONE");
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            })()];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    var load_module_file_path = "/etc/modules";
    var ko_file_path = "/lib/modules/$(uname -r)/kernel/drivers/misc/tty0tty.ko";
    function install() {
        return __awaiter(this, void 0, void 0, function () {
            var _a, exec, onSuccess, tty0tty_dir_path, cdExec, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, install_linux_headers()];
                    case 1:
                        _c.sent();
                        return [4 /*yield*/, scriptLib.apt_get_install_if_missing("git", "git")];
                    case 2:
                        _c.sent();
                        _a = scriptLib.start_long_running_process("Building and installing tty0tty kernel module"), exec = _a.exec, onSuccess = _a.onSuccess;
                        tty0tty_dir_path = path.join(exports.working_directory_path, "tty0tty");
                        cdExec = function (cmd) { return exec(cmd, { "cwd": path.join(tty0tty_dir_path, "module") }); };
                        return [4 /*yield*/, exec("git clone https://github.com/garronej/tty0tty " + tty0tty_dir_path)];
                    case 3:
                        _c.sent();
                        return [4 /*yield*/, cdExec("make")];
                    case 4:
                        _c.sent();
                        return [4 /*yield*/, remove_local_linux_headers()];
                    case 5:
                        _c.sent();
                        return [4 /*yield*/, cdExec("cp tty0tty.ko " + ko_file_path)];
                    case 6:
                        _c.sent();
                        return [4 /*yield*/, exec("rm -r " + tty0tty_dir_path)];
                    case 7:
                        _c.sent();
                        return [4 /*yield*/, exec("depmod")];
                    case 8:
                        _c.sent();
                        return [4 /*yield*/, exec("modprobe tty0tty")];
                    case 9:
                        _c.sent();
                        _c.label = 10;
                    case 10:
                        _c.trys.push([10, 11, , 13]);
                        scriptLib.execSyncQuiet("cat " + load_module_file_path + " | grep tty0tty");
                        return [3 /*break*/, 13];
                    case 11:
                        _b = _c.sent();
                        return [4 /*yield*/, exec("echo tty0tty >> " + load_module_file_path)];
                    case 12:
                        _c.sent();
                        return [3 /*break*/, 13];
                    case 13:
                        onSuccess("OK");
                        return [2 /*return*/];
                }
            });
        });
    }
    tty0tty.install = install;
    function remove() {
        fs.writeFileSync(load_module_file_path, Buffer.from(("" + fs.readFileSync(load_module_file_path)).replace(/tty0tty\n?/g, ""), "utf8"));
        scriptLib.execSyncQuiet("rm -f " + ko_file_path);
    }
    tty0tty.remove = remove;
})(tty0tty || (tty0tty = {}));
var chan_dongle;
(function (chan_dongle) {
    function linkDongleConfigFile() {
        var astetcdir = Astdirs_1.Astdirs.get().astetcdir;
        var dongle_etc_path = path.join(astetcdir, "dongle.conf");
        var dongle_loc_path = path.join(exports.working_directory_path, "dongle.conf");
        scriptLib.execSync("touch " + dongle_etc_path);
        scriptLib.execSync("mv " + dongle_etc_path + " " + dongle_loc_path);
        (function () {
            var unix_user = InstallOptions_1.InstallOptions.get().unix_user;
            scriptLib.execSync("chown " + unix_user + ":" + unix_user + " " + dongle_loc_path);
        })();
        scriptLib.execSync("ln -s " + dongle_loc_path + " " + dongle_etc_path);
        scriptLib.execSync("chmod u+rw,g+r,o+r " + dongle_loc_path);
    }
    chan_dongle.linkDongleConfigFile = linkDongleConfigFile;
    function install() {
        return __awaiter(this, void 0, void 0, function () {
            var chan_dongle_dir_path, _a, exec, onSuccess, ast_ver, cdExec;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        chan_dongle_dir_path = path.join(exports.working_directory_path, "asterisk-chan-dongle");
                        return [4 /*yield*/, scriptLib.apt_get_install_if_missing("automake")];
                    case 1:
                        _b.sent();
                        _a = scriptLib.start_long_running_process("Building and installing asterisk chan_dongle ( may take several minutes )"), exec = _a.exec, onSuccess = _a.onSuccess;
                        ast_ver = scriptLib.sh_eval(build_ast_cmdline() + " -V").match(/^Asterisk\s+([0-9\.]+)/)[1];
                        cdExec = function (cmd) { return exec(cmd, { "cwd": chan_dongle_dir_path }); };
                        return [4 /*yield*/, exec("git clone https://github.com/garronej/asterisk-chan-dongle " + chan_dongle_dir_path)];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, cdExec("./bootstrap")];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, cdExec("./configure --with-astversion=" + ast_ver + " --with-asterisk=" + InstallOptions_1.InstallOptions.get().ast_include_dir_path)];
                    case 4:
                        _b.sent();
                        return [4 /*yield*/, cdExec("make")];
                    case 5:
                        _b.sent();
                        return [4 /*yield*/, cdExec("cp chan_dongle.so " + Astdirs_1.Astdirs.get().astmoddir)];
                    case 6:
                        _b.sent();
                        return [4 /*yield*/, exec("rm -r " + chan_dongle_dir_path)];
                    case 7:
                        _b.sent();
                        linkDongleConfigFile();
                        onSuccess("OK");
                        return [2 /*return*/];
                }
            });
        });
    }
    chan_dongle.install = install;
    function remove() {
        var _a = Astdirs_1.Astdirs.get(), astmoddir = _a.astmoddir, astetcdir = _a.astetcdir;
        scriptLib.execSyncQuiet("rm -rf " + path.join(astetcdir, "dongle.conf"));
        try {
            scriptLib.execSyncQuiet(build_ast_cmdline() + " -rx \"module unload chan_dongle.so\"", { "timeout": 5000 });
        }
        catch (_b) { }
        scriptLib.execSyncQuiet("rm -f " + path.join(astmoddir, "chan_dongle.so"));
    }
    chan_dongle.remove = remove;
})(chan_dongle || (chan_dongle = {}));
var shellScripts;
(function (shellScripts) {
    var get_uninstaller_link_path = function () { return path.join(Astdirs_1.Astdirs.get().astsbindir, path.basename(uninstaller_link_default_path)); };
    var cli_link_path = "/usr/bin/dongle";
    function create() {
        process.stdout.write("Creating launch scripts ... ");
        var cli_sh_path = path.join(exports.working_directory_path, "cli.sh");
        scriptLib.createScript(cli_sh_path, [
            "#!/usr/bin/env bash",
            "",
            "# This script is a proxy to the cli interface of the service ( run $ dongle --help )",
            "# It is in charge of calling the cli.js with the right $HOME, via the bundled",
            "# version of node.js",
            "",
            "cd " + exports.working_directory_path,
            "args=\"\"",
            "for param in \"$@\"",
            "do",
            "   args=\"$args \\\"$param\\\"\"",
            "done",
            "eval \"" + exports.node_path + " " + cli_js_path + " $args\"",
            ""
        ].join("\n"));
        scriptLib.execSyncQuiet("ln -sf " + cli_sh_path + " " + cli_link_path);
        var uninstaller_sh_path = path.join(exports.working_directory_path, "uninstaller.sh");
        scriptLib.createScript(uninstaller_sh_path, [
            "#!/usr/bin/env bash",
            "",
            "# Will uninstall the service and remove source if installed from tarball",
            "",
            "if [ \"$1\" == \"run\" ]",
            "then",
            "   if [[ $EUID -ne 0 ]]; then",
            "       echo \"This script require root privileges.\"",
            "       exit 1",
            "   fi",
            "   " + exports.node_path + " " + __filename + " uninstall",
            "   " + (getIsProd() ? "rm -r " + module_dir_path : ""),
            "else",
            "   echo \"If you wish to uninstall chan-dongle-extended call this script with 'run' as argument:\"",
            "   echo \"$0 run\"",
            "fi",
            ""
        ].join("\n"));
        scriptLib.createSymlink(uninstaller_sh_path, get_uninstaller_link_path());
        console.log(scriptLib.colorize("OK", "GREEN"));
    }
    shellScripts.create = create;
    function remove_symbolic_links() {
        scriptLib.execSyncQuiet("rm -f " + cli_link_path + " " + get_uninstaller_link_path());
    }
    shellScripts.remove_symbolic_links = remove_symbolic_links;
})(shellScripts || (shellScripts = {}));
var asterisk_manager;
(function (asterisk_manager) {
    var ami_conf_back_path = path.join(exports.working_directory_path, "manager.conf.back");
    var get_ami_conf_path = function () { return path.join(Astdirs_1.Astdirs.get().astetcdir, "manager.conf"); };
    function enable() {
        var _a;
        process.stdout.write("Enabling asterisk manager ... ");
        var ami_conf_path = get_ami_conf_path();
        var general = {
            "enabled": "yes",
            "port": InstallOptions_1.InstallOptions.get().enable_ast_ami_on_port,
            "bindaddr": "127.0.0.1",
            "displayconnects": "yes"
        };
        if (!fs.existsSync(ami_conf_path)) {
            var stat = fs.statSync(InstallOptions_1.InstallOptions.get().asterisk_main_conf);
            child_process.execSync("touch " + ami_conf_path, {
                "uid": stat.uid,
                "gid": stat.gid
            });
            scriptLib.execSync("chmod 640 " + ami_conf_path);
        }
        else {
            scriptLib.execSync("cp -p " + ami_conf_path + " " + ami_conf_back_path);
            //TODO: test if return {} when empty file
            var parsed_general = ini_extended_1.ini.parseStripWhitespace(fs.readFileSync(ami_conf_path).toString("utf8"))["general"] || {};
            for (var key in parsed_general) {
                switch (key) {
                    case "enabled": break;
                    case "port":
                        if (!InstallOptions_1.InstallOptions.getDeduced().overwrite_ami_port_if_enabled) {
                            general["port"] = parsed_general["port"];
                        }
                        break;
                    default: general[key] = parsed_general[key];
                }
            }
        }
        var credential = {
            "host": "127.0.0.1",
            "port": general["port"],
            "user": "chan_dongle_extended",
            "secret": "" + Date.now()
        };
        fs.writeFileSync(ami_conf_path, Buffer.from(ini_extended_1.ini.stringify((_a = {
                general: general
            },
            _a[credential.user] = {
                "secret": credential.secret,
                "deny": "0.0.0.0/0.0.0.0",
                "permit": "0.0.0.0/0.0.0.0",
                "read": "all",
                "write": "all",
                "writetimeout": "5000"
            },
            _a)), "utf8"));
        try {
            scriptLib.execSyncQuiet(build_ast_cmdline() + " -rx \"core reload\"", { "timeout": 5000 });
        }
        catch (_b) { }
        AmiCredential_1.AmiCredential.set(credential);
        console.log(scriptLib.colorize("OK", "GREEN"));
    }
    asterisk_manager.enable = enable;
    function restore() {
        scriptLib.execSyncQuiet("rm -f " + get_ami_conf_path());
        if (fs.existsSync(ami_conf_back_path)) {
            scriptLib.execSyncQuiet("mv " + ami_conf_back_path + " " + get_ami_conf_path());
        }
        try {
            scriptLib.execSyncQuiet(build_ast_cmdline() + " -rx \"core reload\"", { "timeout": 5000 });
        }
        catch (_a) { }
    }
    asterisk_manager.restore = restore;
})(asterisk_manager || (asterisk_manager = {}));
var udevRules;
(function (udevRules) {
    var rules_path = path.join("/etc/udev/rules.d", "98-" + exports.srv_name + ".rules");
    function create() {
        return __awaiter(this, void 0, void 0, function () {
            var e_7, _a, unix_user, _b, recordIfNum, ConnectionMonitor, vendorIds, rules, vendorIds_1, vendorIds_1_1, vendorId;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, scriptLib.apt_get_install("usb-modeswitch")];
                    case 1:
                        _c.sent();
                        //NOTE: we could grant access only to "dongle" group as asterisk is added to this group but need restart ast...
                        process.stdout.write("Creating udev rules " + rules_path + " ... ");
                        scriptLib.execSync("mkdir -p " + path.dirname(rules_path));
                        unix_user = InstallOptions_1.InstallOptions.get().unix_user;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("ts-gsm-modem"); })];
                    case 2:
                        _b = _c.sent(), recordIfNum = _b.recordIfNum, ConnectionMonitor = _b.ConnectionMonitor;
                        vendorIds = Object.keys(recordIfNum);
                        rules = "# Automatically generated by chan-dongle-extended. (disable network on dongles )\n\n";
                        try {
                            for (vendorIds_1 = __values(vendorIds), vendorIds_1_1 = vendorIds_1.next(); !vendorIds_1_1.done; vendorIds_1_1 = vendorIds_1.next()) {
                                vendorId = vendorIds_1_1.value;
                                rules += [
                                    "ACTION==\"add\"",
                                    "ENV{ID_VENDOR_ID}==\"" + vendorId + "\"",
                                    "ENV{SUBSYSTEM}==\"tty\"",
                                    "ENV{ID_USB_INTERFACE_NUM}==\"[0-9]*\"",
                                    "MODE=\"0666\"",
                                    "GROUP=\"" + unix_user + "\""
                                ].join(", ") + "\n";
                                rules += [
                                    "ACTION==\"add\"",
                                    "ENV{ID_VENDOR_ID}==\"" + vendorId + "\"",
                                    "ENV{SUBSYSTEM}==\"net\"",
                                    "ENV{ID_USB_INTERFACE_NUM}==\"[0-9]*\"",
                                    "RUN+=\"/bin/sh -c 'echo 0 > /sys$DEVPATH/device/authorized'\""
                                ].join(", ") + "\n";
                            }
                        }
                        catch (e_7_1) { e_7 = { error: e_7_1 }; }
                        finally {
                            try {
                                if (vendorIds_1_1 && !vendorIds_1_1.done && (_a = vendorIds_1.return)) _a.call(vendorIds_1);
                            }
                            finally { if (e_7) throw e_7.error; }
                        }
                        rules += [
                            "ACTION==\"add\"",
                            "ENV{DEVPATH}==\"/devices/virtual/tty/tnt[0-9]*\"",
                            "MODE=\"0666\"",
                            "GROUP=\"" + unix_user + "\""
                        ].join(", ") + "\n";
                        fs.writeFileSync(rules_path, rules);
                        scriptLib.execSync("systemctl restart udev.service");
                        console.log(scriptLib.colorize("OK", "GREEN"));
                        scriptLib.execSync("chown " + unix_user + ":" + unix_user + " " + rules_path);
                        return [4 /*yield*/, (function applying_rules() {
                                return __awaiter(this, void 0, void 0, function () {
                                    var e_8, _a, e_9, _b, monitor, _c, _d, accessPoint, _e, _f, device_path;
                                    return __generator(this, function (_g) {
                                        switch (_g.label) {
                                            case 0:
                                                scriptLib.execSync("chown root:" + unix_user + " /dev/tnt*");
                                                scriptLib.execSync("chmod u+rw,g+rw,o+rw /dev/tnt*");
                                                monitor = ConnectionMonitor.getInstance(console.log.bind(console));
                                                console.log("Detecting currently connected modems ... ");
                                                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(function () { return resolve(); }, 4100); })];
                                            case 1:
                                                _g.sent();
                                                if (!monitor.connectedModems.size) {
                                                    console.log("No USB dongles currently connected.");
                                                }
                                                try {
                                                    for (_c = __values(monitor.connectedModems), _d = _c.next(); !_d.done; _d = _c.next()) {
                                                        accessPoint = _d.value;
                                                        try {
                                                            for (_e = __values([accessPoint.audioIfPath, accessPoint.dataIfPath]), _f = _e.next(); !_f.done; _f = _e.next()) {
                                                                device_path = _f.value;
                                                                scriptLib.execSync("chown root:" + unix_user + " " + device_path);
                                                                scriptLib.execSync("chmod u+rw,g+rw,o+rw " + device_path);
                                                            }
                                                        }
                                                        catch (e_9_1) { e_9 = { error: e_9_1 }; }
                                                        finally {
                                                            try {
                                                                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                                                            }
                                                            finally { if (e_9) throw e_9.error; }
                                                        }
                                                    }
                                                }
                                                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                                                finally {
                                                    try {
                                                        if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                                                    }
                                                    finally { if (e_8) throw e_8.error; }
                                                }
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            })()];
                    case 3:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    udevRules.create = create;
    function remove() {
        scriptLib.execSyncQuiet("rm -rf " + rules_path);
        scriptLib.execSyncQuiet("systemctl restart udev.service");
    }
    udevRules.remove = remove;
})(udevRules || (udevRules = {}));
function apt_get_install_asterisk() {
    return __awaiter(this, void 0, void 0, function () {
        var pr_install_ast, service_path, watcher;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (scriptLib.apt_get_install_if_missing.doesHaveProg("asterisk") &&
                        !scriptLib.apt_get_install_if_missing.isPkgInstalled("asterisk")) {
                        //Custom install, we do not install from repositories.
                        return [2 /*return*/];
                    }
                    if (!scriptLib.apt_get_install_if_missing.isPkgInstalled("asterisk")) {
                        //If asterisk is not installed make sure asterisk-config is purged so the config files will be re-generated.
                        scriptLib.execSyncQuiet("dpkg -P asterisk-config");
                    }
                    pr_install_ast = scriptLib.apt_get_install_if_missing("asterisk-dev");
                    service_path = "/lib/systemd/system/asterisk.service";
                    watcher = fs.watch(path.dirname(service_path), function (event, filename) {
                        if (event === 'rename' &&
                            filename === path.basename(service_path) &&
                            fs.existsSync(service_path)) {
                            fs.writeFileSync(service_path, Buffer.from(fs.readFileSync(service_path).toString("utf8").replace("\n[Service]\n", "\n[Service]\nTimeoutSec=infinity\n"), "utf8"));
                            scriptLib.execSync("systemctl daemon-reload");
                        }
                    });
                    return [4 /*yield*/, pr_install_ast];
                case 1:
                    _a.sent();
                    watcher.close();
                    return [2 /*return*/];
            }
        });
    });
}
var modemManager;
(function (modemManager) {
    function disable_and_stop() {
        try {
            scriptLib.execSyncQuiet("systemctl stop ModemManager");
            console.log(scriptLib.colorize([
                "ModemManager was previously managing dongles on this host, is has been disabled. ",
                "You need to disconnect and reconnect your GSM dongles"
            ].join("\n"), "YELLOW"));
        }
        catch (_a) { }
        try {
            scriptLib.execSyncQuiet("systemctl disable ModemManager");
        }
        catch (_b) { }
    }
    modemManager.disable_and_stop = disable_and_stop;
    function enable_and_start() {
        try {
            scriptLib.execSyncQuiet("systemctl enable ModemManager");
        }
        catch (_a) { }
        try {
            scriptLib.execSyncQuiet("systemctl start ModemManager");
        }
        catch (_b) { }
    }
    modemManager.enable_and_start = enable_and_start;
})(modemManager || (modemManager = {}));
function install_prereq() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, scriptLib.apt_get_install_if_missing("python", "python")];
                case 1:
                    _a.sent();
                    //NOTE assume python 2 available. var range = semver.Range('>=2.5.0 <3.0.0')
                    return [4 /*yield*/, scriptLib.apt_get_install_if_missing("python-pip", "pip")];
                case 2:
                    //NOTE assume python 2 available. var range = semver.Range('>=2.5.0 <3.0.0')
                    _a.sent();
                    return [4 /*yield*/, (function installVirtualenv() {
                            return __awaiter(this, void 0, void 0, function () {
                                var _a, _b, exec, onSuccess, _c;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0:
                                            process.stdout.write("Checking for python module virtualenv ... ");
                                            _d.label = 1;
                                        case 1:
                                            _d.trys.push([1, 2, , 9]);
                                            scriptLib.execSyncQuiet("which virtualenv");
                                            return [3 /*break*/, 9];
                                        case 2:
                                            _a = _d.sent();
                                            readline.clearLine(process.stdout, 0);
                                            process.stdout.write("\r");
                                            _b = scriptLib.start_long_running_process("Installing virtualenv"), exec = _b.exec, onSuccess = _b.onSuccess;
                                            _d.label = 3;
                                        case 3:
                                            _d.trys.push([3, 5, , 8]);
                                            return [4 /*yield*/, scriptLib.exec("pip install virtualenv")];
                                        case 4:
                                            _d.sent();
                                            return [3 /*break*/, 8];
                                        case 5:
                                            _c = _d.sent();
                                            return [4 /*yield*/, exec("pip install -i https://pypi.python.org/simple/ --upgrade pip")];
                                        case 6:
                                            _d.sent();
                                            return [4 /*yield*/, exec("pip install virtualenv")];
                                        case 7:
                                            _d.sent();
                                            return [3 /*break*/, 8];
                                        case 8:
                                            onSuccess("DONE");
                                            return [2 /*return*/];
                                        case 9:
                                            console.log("found. " + scriptLib.colorize("OK", "GREEN"));
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        })()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, scriptLib.apt_get_install_if_missing("build-essential")];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, scriptLib.apt_get_install_if_missing("libudev-dev")];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
;
function build_ast_cmdline() {
    var _a = InstallOptions_1.InstallOptions.get(), ld_library_path_for_asterisk = _a.ld_library_path_for_asterisk, asterisk_main_conf = _a.asterisk_main_conf;
    var astsbindir = Astdirs_1.Astdirs.get().astsbindir;
    return "LD_LIBRARY_PATH=" + ld_library_path_for_asterisk + " " + path.join(astsbindir, "asterisk") + " -C " + asterisk_main_conf;
}
exports.build_ast_cmdline = build_ast_cmdline;
function rebuild_node_modules() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, exec, onSuccess;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = scriptLib.start_long_running_process("Building node_modules dependencies"), exec = _a.exec, onSuccess = _a.onSuccess;
                    return [4 /*yield*/, (function build_udev() {
                            return __awaiter(this, void 0, void 0, function () {
                                var e_10, _a, udev_dir_path, pre_gyp_dir_path, _b, _c, _module_dir_path;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0:
                                            udev_dir_path = scriptLib.find_module_path("udev", module_dir_path);
                                            if (fs.existsSync(path.join(udev_dir_path, "build"))) {
                                                return [2 /*return*/];
                                            }
                                            pre_gyp_dir_path = "";
                                            try {
                                                for (_b = __values([udev_dir_path, module_dir_path]), _c = _b.next(); !_c.done; _c = _b.next()) {
                                                    _module_dir_path = _c.value;
                                                    try {
                                                        pre_gyp_dir_path = scriptLib.find_module_path("node-pre-gyp", _module_dir_path);
                                                        break;
                                                    }
                                                    catch (_e) { }
                                                }
                                            }
                                            catch (e_10_1) { e_10 = { error: e_10_1 }; }
                                            finally {
                                                try {
                                                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                                                }
                                                finally { if (e_10) throw e_10.error; }
                                            }
                                            return [4 /*yield*/, exec([
                                                    "PATH=" + path.join(module_dir_path) + ":$PATH",
                                                    path.basename(exports.node_path) + " " + path.join(pre_gyp_dir_path, "bin", "node-pre-gyp") + " install",
                                                    "--fallback-to-build"
                                                ].join(" "), { "cwd": udev_dir_path })];
                                        case 1:
                                            _d.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        })()];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (function postinstall_node_python_messaging() {
                            return __awaiter(this, void 0, void 0, function () {
                                var node_python_messaging_dir_path;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            node_python_messaging_dir_path = scriptLib.find_module_path("node-python-messaging", module_dir_path);
                                            if (fs.existsSync(path.join(node_python_messaging_dir_path, "dist", "virtual"))) {
                                                return [2 /*return*/];
                                            }
                                            return [4 /*yield*/, exec("./install-python-dep.sh", { "cwd": node_python_messaging_dir_path })];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        })()];
                case 2:
                    _b.sent();
                    onSuccess("DONE");
                    return [2 /*return*/];
            }
        });
    });
}
if (require.main === module) {
    process.once("unhandledRejection", function (error) { throw error; });
    scriptLib.exit_if_not_root();
    scriptLib.apt_get_install.onInstallSuccess = function (package_name) {
        return scriptLib.apt_get_install.record_installed_package(installed_pkg_record_path, package_name);
    };
    Promise.resolve().then(function () { return require("commander"); }).then(function (program) {
        var _install = program.command("install");
        for (var key in InstallOptions_1.InstallOptions.defaults) {
            var value = InstallOptions_1.InstallOptions.defaults[key];
            switch (typeof value) {
                case "string":
                    _install = _install.option("--" + key + " [{" + key + "}]", "default: " + value);
                    break;
                case "number":
                    _install = _install.option("--" + key + " <{" + key + "}>", "default: " + value, parseInt);
                    break;
                case "boolean":
                    _install = _install.option("--" + key, "default: " + value);
                    break;
            }
        }
        _install.action(function (options) { return program_action_install(options); });
        program
            .command("uninstall")
            .action(function () { return program_action_uninstall(); });
        program
            .command("update")
            .option("--path [{path}]")
            .action(function (options) { return program_action_update(options); });
        program
            .command("tarball")
            .action(function () { return program_action_tarball(); });
        program.parse(process.argv);
    });
}
