#!/usr/bin/env node
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
require("rejection-tracker").main(__dirname, "..", "..");
var program = require("commander");
var child_process = require("child_process");
var execSync = function (cmd) { return child_process.execSync(cmd).toString("utf8"); };
var execSyncSilent = function (cmd) { return child_process.execSync(cmd, { stdio: [] }).toString("utf8"); };
var fs = require("fs");
var path = require("path");
var scriptLib = require("../tools/scriptLib");
var readline = require("readline");
var localsManager = require("../lib/localsManager");
var node_path = process.argv[0];
var module_path = path.join(__dirname, "..", "..");
var _a = __read(["cli.js", "main.js"].map(function (f) { return path.join(module_path, "dist", "bin", f); }), 2), cli_js_path = _a[0], main_js_path = _a[1];
var working_directory_path = path.join(module_path, "working_directory");
var stop_sh_path = path.join(working_directory_path, "stop.sh");
var wait_ast_sh_path = path.join(working_directory_path, "wait_ast.sh");
var _install = program.command("install");
for (var key in localsManager.Locals.defaults) {
    var value = localsManager.Locals.defaults[key];
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
_install.action(function (options) { return __awaiter(_this, void 0, void 0, function () {
    var _this = this;
    var locals, key, astdirs, message, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("---Installing chan-dongle-extended---");
                return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                        var astetcdir, pr_install_ast, service_path, watcher;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    astetcdir = options["astetcdir"];
                                    if (!!astetcdir) {
                                        return [2 /*return*/];
                                    }
                                    try {
                                        execSyncSilent("which asterisk");
                                        return [2 /*return*/];
                                    }
                                    catch (_b) { }
                                    pr_install_ast = scriptLib.apt_get_install("asterisk-dev");
                                    service_path = "/lib/systemd/system/asterisk.service";
                                    watcher = fs.watch(path.dirname(service_path), function (event, filename) {
                                        if (event === 'rename' &&
                                            filename === path.basename(service_path) &&
                                            fs.existsSync(service_path)) {
                                            fs.writeFileSync(service_path, Buffer.from(fs.readFileSync(service_path).toString("utf8").replace("\n[Service]\n", "\n[Service]\nTimeoutSec=infinity\n"), "utf8"));
                                            execSync("systemctl daemon-reload");
                                        }
                                    });
                                    return [4 /*yield*/, pr_install_ast];
                                case 1:
                                    _a.sent();
                                    watcher.close();
                                    return [2 /*return*/];
                            }
                        });
                    }); })()];
            case 1:
                _b.sent();
                locals = __assign({}, localsManager.Locals.defaults);
                for (key in localsManager.Locals.defaults) {
                    if (options[key] !== undefined) {
                        locals[key] = options[key];
                    }
                }
                locals.build_across_linux_kernel = "" + execSync("uname -r");
                try {
                    astdirs = localsManager.get.readAstdirs(locals.astetcdir);
                }
                catch (_c) {
                    message = _c.message;
                    console.log(scriptLib.colorize("Failed to parse asterisk.conf: " + message, "RED"));
                    process.exit(-1);
                    return [2 /*return*/];
                }
                execSync("chmod u+r,g+r,o+r " + path.join(astdirs.astetcdir, "asterisk.conf"));
                if (!fs.existsSync(working_directory_path)) return [3 /*break*/, 3];
                process.stdout.write(scriptLib.colorize("Already installed, erasing previous install... ", "YELLOW"));
                return [4 /*yield*/, uninstall(locals, astdirs)];
            case 2:
                _b.sent();
                console.log("DONE");
                _b.label = 3;
            case 3:
                _b.trys.push([3, 5, , 7]);
                return [4 /*yield*/, install(locals, astdirs)];
            case 4:
                _b.sent();
                return [3 /*break*/, 7];
            case 5:
                _a = _b.sent();
                process.stdout.write(scriptLib.colorize("Rollback install ...", "YELLOW"));
                return [4 /*yield*/, uninstall(locals, astdirs)];
            case 6:
                _b.sent();
                console.log("DONE");
                process.exit(-1);
                return [2 /*return*/];
            case 7:
                console.log("---DONE---");
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("uninstall")
    .action(function () { return __awaiter(_this, void 0, void 0, function () {
    var _a, locals, astdirs;
    return __generator(this, function (_b) {
        console.log("---Uninstalling chan-dongle-extended---");
        try {
            _a = localsManager.get(working_directory_path), locals = _a.locals, astdirs = _a.astdirs;
        }
        catch (_c) {
            console.log(scriptLib.colorize("Not installed", "YELLOW"));
            process.exit(0);
            return [2 /*return*/];
        }
        uninstall(locals, astdirs, "VERBOSE");
        console.log("---DONE---");
        process.exit(0);
        return [2 /*return*/];
    });
}); });
function install(locals, astdirs) {
    return __awaiter(this, void 0, void 0, function () {
        var astetcdir, astsbindir, astmoddir, astrundir;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    astetcdir = astdirs.astetcdir, astsbindir = astdirs.astsbindir, astmoddir = astdirs.astmoddir, astrundir = astdirs.astrundir;
                    unixUser.create(locals.service_name);
                    workingDirectory.create(locals.service_name);
                    (function () {
                        var local_path = path.join(working_directory_path, localsManager.file_name);
                        fs.writeFileSync(local_path, Buffer.from(JSON.stringify(locals, null, 2), "utf8"));
                        execSync("chown " + locals.service_name + ":" + locals.service_name + " " + local_path);
                    })();
                    return [4 /*yield*/, tty0tty.install()];
                case 1:
                    _a.sent();
                    if (!locals.assume_chan_dongle_installed) return [3 /*break*/, 2];
                    console.log(scriptLib.colorize("Assuming chan_dongle already installed.", "YELLOW"));
                    chan_dongle.chownConfFile(astetcdir, locals.service_name);
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, chan_dongle.install(astsbindir, locals.ast_include_dir_path, astmoddir, astetcdir, locals.service_name)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [4 /*yield*/, udevRules.create(locals.service_name)];
                case 5:
                    _a.sent();
                    createShellScripts(locals.service_name, astsbindir);
                    systemd.create(locals.service_name);
                    return [4 /*yield*/, enableAsteriskManager(locals.service_name, astetcdir, locals.ami_port, astsbindir, astrundir)];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function uninstall(locals, astdirs, verbose) {
    var write = !!verbose ? process.stdout.write.bind(process.stdout) : (function () { });
    var log = function (str) { return write(str + "\n"); };
    var runRecover = function (description, action) {
        write(description);
        try {
            action();
            log(scriptLib.colorize("ok", "GREEN"));
        }
        catch (_a) {
            var message = _a.message;
            log(scriptLib.colorize(message, "RED"));
        }
    };
    runRecover("Stopping running instance ... ", function () { return execSyncSilent(stop_sh_path); });
    if (locals.assume_chan_dongle_installed) {
        log("Skipping uninstall of chan_dongle.so as it was installed separately");
    }
    else {
        runRecover("Uninstalling chan_dongle.so ... ", function () { return chan_dongle.remove(astdirs.astmoddir, astdirs.astsbindir); });
    }
    runRecover("Removing cli tool symbolic link ... ", function () { return execSyncSilent("rm " + path.join(astdirs.astsbindir, locals.service_name)); });
    runRecover("Removing systemd service ... ", function () { return systemd.remove(locals.service_name); });
    runRecover("Removing udev rules ... ", function () { return udevRules.remove(locals.service_name); });
    runRecover("Removing tty0tty kernel module ...", function () { return tty0tty.remove(); });
    runRecover("Removing app working directory ... ", function () { return workingDirectory.remove(); });
    runRecover("Deleting unix user ... ", function () { return unixUser.remove(locals.service_name); });
}
var tty0tty;
(function (tty0tty) {
    var h_dir_path = path.join(working_directory_path, "linux-headers");
    var build_link_path = "/lib/modules/$(uname -r)/build";
    function remove_local_linux_headers() {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, scriptLib.showLoad.exec("rm -r " + h_dir_path + " 2>/dev/null", function () { })];
                    case 1:
                        _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/];
                    case 3:
                        execSync("rm " + build_link_path);
                        return [2 /*return*/];
                }
            });
        });
    }
    function install_linux_headers() {
        return __awaiter(this, void 0, void 0, function () {
            var kernel_release, are_headers_installed, is_raspbian_host, h_deb_path;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        kernel_release = execSync("uname -r").replace(/\n$/, "");
                        are_headers_installed = function () {
                            try {
                                execSync("ls " + path.join(build_link_path, "include") + " 2>/dev/null");
                            }
                            catch (_a) {
                                return false;
                            }
                            return true;
                        };
                        process.stdout.write("Checking for linux kernel headers ...");
                        if (are_headers_installed()) {
                            console.log("found. " + scriptLib.colorize("OK", "GREEN"));
                            return [2 /*return*/];
                        }
                        readline.clearLine(process.stdout, 0);
                        process.stdout.write("\r");
                        is_raspbian_host = !!execSync("cat /etc/os-release").match(/^NAME=.*Raspbian.*$/m);
                        if (!!is_raspbian_host) return [3 /*break*/, 2];
                        return [4 /*yield*/, scriptLib.apt_get_install("linux-headers-$(uname -r)")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                    case 2:
                        h_deb_path = path.join(working_directory_path, "linux-headers.deb");
                        return [4 /*yield*/, (function download_deb() {
                                return __awaiter(this, void 0, void 0, function () {
                                    var _a, onSuccess, onError, wget, firmware_release, url, _b, url, _c;
                                    return __generator(this, function (_d) {
                                        switch (_d.label) {
                                            case 0:
                                                _a = scriptLib.showLoad("Downloading raspberrypi linux headers"), onSuccess = _a.onSuccess, onError = _a.onError;
                                                wget = function (url) { return scriptLib.showLoad.exec("wget " + url + " -O " + h_deb_path, function () { }); };
                                                _d.label = 1;
                                            case 1:
                                                _d.trys.push([1, 3, , 8]);
                                                firmware_release = execSync("zcat /usr/share/doc/raspberrypi-bootloader/changelog.Debian.gz | head")
                                                    .match(/^[^r]*raspberrypi-firmware\ \(([^\)]+)\)/)[1];
                                                url = [
                                                    "https://archive.raspberrypi.org/debian/pool/main/r/raspberrypi-firmware/",
                                                    "raspberrypi-kernel-headers_" + firmware_release + "_armhf.deb"
                                                ].join("");
                                                return [4 /*yield*/, wget(url)];
                                            case 2:
                                                _d.sent();
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
                                                return [4 /*yield*/, wget(url)];
                                            case 5:
                                                _d.sent();
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
                                    var _a, onSuccess, onError, build_dir_path;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                _a = scriptLib.showLoad("Installing linux headers"), onSuccess = _a.onSuccess, onError = _a.onError;
                                                return [4 /*yield*/, scriptLib.showLoad.exec("dpkg -x " + h_deb_path + " " + h_dir_path, onError)];
                                            case 1:
                                                _b.sent();
                                                return [4 /*yield*/, scriptLib.showLoad.exec("rm " + h_deb_path, onError)];
                                            case 2:
                                                _b.sent();
                                                build_dir_path = path.join(h_dir_path, "usr", "src", "linux-headers-" + kernel_release);
                                                execSync("mv " + path.join(h_dir_path, "usr", "src", kernel_release) + " " + build_dir_path + " 2>/dev/null || true");
                                                execSync("rm -f " + build_link_path);
                                                execSync("ln -s " + build_dir_path + " " + build_link_path);
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
    function install() {
        return __awaiter(this, void 0, void 0, function () {
            var _a, onSuccess, onError, tty0tty_dir_path, exec, cdExec, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, install_linux_headers()];
                    case 1:
                        _c.sent();
                        return [4 /*yield*/, scriptLib.apt_get_install("git", "git")];
                    case 2:
                        _c.sent();
                        _a = scriptLib.showLoad("Building and installing tty0tty kernel module"), onSuccess = _a.onSuccess, onError = _a.onError;
                        tty0tty_dir_path = path.join(working_directory_path, "tty0tty");
                        exec = function (cmd) { return scriptLib.showLoad.exec(cmd, onError); };
                        cdExec = function (cmd) { return exec("(cd " + path.join(tty0tty_dir_path, "module") + " && " + cmd + ")"); };
                        return [4 /*yield*/, exec("git clone https://github.com/garronej/tty0tty " + tty0tty_dir_path)];
                    case 3:
                        _c.sent();
                        return [4 /*yield*/, cdExec("make")];
                    case 4:
                        _c.sent();
                        return [4 /*yield*/, remove_local_linux_headers()];
                    case 5:
                        _c.sent();
                        return [4 /*yield*/, cdExec("cp tty0tty.ko /lib/modules/$(uname -r)/kernel/drivers/misc/")];
                    case 6:
                        _c.sent();
                        return [4 /*yield*/, exec("depmod")];
                    case 7:
                        _c.sent();
                        return [4 /*yield*/, exec("modprobe tty0tty")];
                    case 8:
                        _c.sent();
                        _c.label = 9;
                    case 9:
                        _c.trys.push([9, 10, , 12]);
                        execSync("cat " + load_module_file_path + " | grep tty0tty");
                        return [3 /*break*/, 12];
                    case 10:
                        _b = _c.sent();
                        return [4 /*yield*/, exec("echo tty0tty >> " + load_module_file_path)];
                    case 11:
                        _c.sent();
                        return [3 /*break*/, 12];
                    case 12:
                        onSuccess("OK");
                        return [2 /*return*/];
                }
            });
        });
    }
    tty0tty.install = install;
    function remove() {
        fs.writeFileSync(load_module_file_path, Buffer.from(("" + fs.readFileSync(load_module_file_path)).replace("tty0tty", ""), "utf8"));
        execSyncSilent("rm -f /lib/modules/$(uname -r)/kernel/drivers/misc/tty0tty.ko");
    }
    tty0tty.remove = remove;
})(tty0tty || (tty0tty = {}));
var chan_dongle;
(function (chan_dongle) {
    var chan_dongle_dir_path = path.join(working_directory_path, "asterisk-chan-dongle");
    function chownConfFile(astetcdir, service_name) {
        var dongle_path = path.join(astetcdir, "dongle.conf");
        execSync("touch " + dongle_path);
        execSync("chown " + service_name + ":" + service_name + " " + dongle_path);
        execSync("chmod u+rw,g+r,o+r " + dongle_path);
    }
    chan_dongle.chownConfFile = chownConfFile;
    function install(astsbindir, ast_include_dir_path, astmoddir, astetcdir, service_name) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, onSuccess, onError, ast_ver, exec, cdExec;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, scriptLib.apt_get_install("automake")];
                    case 1:
                        _b.sent();
                        _a = scriptLib.showLoad("Building and installing asterisk chan_dongle ( may take several minutes )"), onSuccess = _a.onSuccess, onError = _a.onError;
                        ast_ver = execSync(path.join(astsbindir, "asterisk") + " -V")
                            .match(/^Asterisk\s+([0-9\.]+)/)[1];
                        exec = function (cmd) { return scriptLib.showLoad.exec(cmd, onError); };
                        cdExec = function (cmd) { return exec("(cd " + chan_dongle_dir_path + " && " + cmd + ")"); };
                        return [4 /*yield*/, exec("git clone https://github.com/garronej/asterisk-chan-dongle " + chan_dongle_dir_path)];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, cdExec("./bootstrap")];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, cdExec("./configure --with-astversion=" + ast_ver + " --with-asterisk=" + ast_include_dir_path)];
                    case 4:
                        _b.sent();
                        return [4 /*yield*/, cdExec("make")];
                    case 5:
                        _b.sent();
                        return [4 /*yield*/, cdExec("cp chan_dongle.so " + astmoddir)];
                    case 6:
                        _b.sent();
                        chownConfFile(astetcdir, service_name);
                        onSuccess("OK");
                        return [2 /*return*/];
                }
            });
        });
    }
    chan_dongle.install = install;
    function remove(astmoddir, astsbindir) {
        try {
            execSyncSilent(path.join(astsbindir, "asterisk") + " -rx \"module unload chan_dongle.so\"");
        }
        catch (_a) { }
        execSyncSilent("rm -f " + path.join(astmoddir, "chan_dongle.so"));
    }
    chan_dongle.remove = remove;
})(chan_dongle || (chan_dongle = {}));
var workingDirectory;
(function (workingDirectory) {
    function create(service_name) {
        process.stdout.write("Creating app working directory '" + working_directory_path + "' ... ");
        execSync("mkdir " + working_directory_path);
        execSync("chown " + service_name + ":" + service_name + " " + working_directory_path);
        console.log(scriptLib.colorize("OK", "GREEN"));
    }
    workingDirectory.create = create;
    function remove() {
        execSyncSilent("rm -r " + working_directory_path);
    }
    workingDirectory.remove = remove;
})(workingDirectory || (workingDirectory = {}));
var unixUser;
(function (unixUser) {
    function create(service_name) {
        process.stdout.write("Creating unix user '" + service_name + "' ... ");
        execSync("useradd -M " + service_name + " -s /bin/false -d " + working_directory_path);
        console.log(scriptLib.colorize("OK", "GREEN"));
    }
    unixUser.create = create;
    function remove(service_name) {
        execSyncSilent("userdel " + service_name);
    }
    unixUser.remove = remove;
})(unixUser || (unixUser = {}));
function createShellScripts(service_name, astsbindir) {
    process.stdout.write("Creating launch scripts ... ");
    var writeAndSetPerms = function (script_path, script) {
        fs.writeFileSync(script_path, Buffer.from(script, "utf8"));
        execSync("chown " + service_name + ":" + service_name + " " + script_path);
        execSync("chmod +x " + script_path);
    };
    writeAndSetPerms(stop_sh_path, [
        "#!/usr/bin/env bash",
        "",
        "pkill -u " + service_name + " -SIGUSR2 || true",
        ""
    ].join("\n"));
    writeAndSetPerms(wait_ast_sh_path, [
        "#!/usr/bin/env bash",
        "",
        "until " + path.join(astsbindir, "asterisk") + " -rx \"core waitfullybooted\"",
        "do",
        "   sleep 3",
        "done",
        ""
    ].join("\n"));
    var cli_sh_path = path.join(working_directory_path, "cli.sh");
    writeAndSetPerms(cli_sh_path, [
        "#!/usr/bin/env bash",
        "",
        "cd " + working_directory_path,
        "args=\"\"",
        "for param in \"$@\"",
        "do",
        "   args=\"$args \\\"$param\\\"\"",
        "done",
        "sudo su -s $(which bash) -c \"" + node_path + " " + cli_js_path + " $args\" " + service_name,
        ""
    ].join("\n"));
    execSync("ln -s " + cli_sh_path + " " + path.join(astsbindir, service_name));
    writeAndSetPerms(path.join(working_directory_path, "main.sh"), [
        "#!/usr/bin/env bash",
        "",
        "" + stop_sh_path,
        "" + wait_ast_sh_path,
        "cd " + working_directory_path,
        "su -s $(which bash) -c \"" + node_path + " " + main_js_path + "\" " + service_name,
        ""
    ].join("\n"));
    console.log(scriptLib.colorize("OK", "GREEN"));
}
var systemd;
(function (systemd) {
    function get_service_path(service_name) {
        return path.join("/etc/systemd/system", service_name + ".service");
    }
    function create(service_name) {
        var service_path = get_service_path(service_name);
        process.stdout.write("Creating systemd service " + service_path + " ... ");
        var service = [
            "[Unit]",
            "Description=chan-dongle-extended service.",
            "After=network.target",
            "",
            "[Service]",
            "ExecStartPre=" + stop_sh_path + " && " + wait_ast_sh_path,
            "ExecStart=" + node_path + " " + main_js_path,
            "Environment=NODE_ENV=production",
            "PermissionsStartOnly=true",
            "StandardOutput=journal",
            "WorkingDirectory=" + working_directory_path,
            "Restart=always",
            "RestartPreventExitStatus=0",
            "RestartSec=10",
            "User=" + service_name,
            "Group=" + service_name,
            "",
            "[Install]",
            "WantedBy=multi-user.target",
            ""
        ].join("\n");
        fs.writeFileSync(service_path, Buffer.from(service, "utf8"));
        execSync("systemctl daemon-reload");
        execSync("systemctl enable " + service_name + " --quiet");
        console.log(scriptLib.colorize("OK", "GREEN"));
    }
    systemd.create = create;
    function remove(service_name) {
        try {
            execSyncSilent("systemctl disable " + service_name + " --quiet");
            fs.unlinkSync(get_service_path(service_name));
        }
        catch (_a) { }
        execSyncSilent("systemctl daemon-reload");
    }
    systemd.remove = remove;
})(systemd || (systemd = {}));
function enableAsteriskManager(service_name, astetcdir, ami_port, astsbindir, astrundir) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, ini, misc, manager_path, general, does_file_exist, ami_user_conf, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    process.stdout.write("Enabling asterisk manager on port " + ami_port + " ... ");
                    return [4 /*yield*/, Promise.all([
                            Promise.resolve().then(function () { return require("ini-extended"); }),
                            Promise.resolve().then(function () { return require("../chan-dongle-extended-client"); }),
                        ])];
                case 1:
                    _a = __read.apply(void 0, [_c.sent(), 2]), ini = _a[0].ini, misc = _a[1].misc;
                    manager_path = path.join(astetcdir, "manager.conf");
                    general = {
                        "enabled": "yes",
                        "port": "" + ami_port,
                        "bindaddr": "127.0.0.1",
                        "displayconnects": "yes"
                    };
                    does_file_exist = false;
                    if (fs.existsSync(manager_path)) {
                        does_file_exist = true;
                        try {
                            general = ini.parseStripWhitespace(fs.readFileSync(manager_path).toString("utf8")).general;
                            general.enabled = "yes";
                            general.port = "" + ami_port;
                        }
                        catch (_d) { }
                    }
                    ami_user_conf = {
                        "secret": "" + Date.now(),
                        "deny": "0.0.0.0/0.0.0.0",
                        "permit": "0.0.0.0/0.0.0.0",
                        "read": "all",
                        "write": "all",
                        "writetimeout": "5000"
                    };
                    fs.writeFileSync(manager_path, Buffer.from(ini.stringify((_b = { general: general }, _b[misc.amiUser] = ami_user_conf, _b)), "utf8"));
                    if (!does_file_exist) {
                        execSync("chown " + service_name + ":" + service_name + " " + manager_path);
                    }
                    execSync("chmod u+r,g+r,o+r " + manager_path);
                    if (fs.existsSync(path.join(astrundir, "asterisk.ctl"))) {
                        try {
                            execSyncSilent(path.join(astsbindir, "asterisk") + " -rx \"core reload\"");
                        }
                        catch (_e) { }
                    }
                    console.log(scriptLib.colorize("OK", "GREEN"));
                    return [2 /*return*/];
            }
        });
    });
}
var udevRules;
(function (udevRules) {
    function make_rules_path(service_name) {
        return path.join("/etc/udev/rules.d", "98-" + service_name + ".rules");
    }
    function create(service_name) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var rules_path, _a, recordIfNum, ConnectionMonitor, vendorIds, rules, vendorIds_1, vendorIds_1_1, vendorId, e_1, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        rules_path = make_rules_path(service_name);
                        process.stdout.write("Creating udev rules " + rules_path + " ... ");
                        execSync("mkdir -p " + path.dirname(rules_path));
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("ts-gsm-modem"); })];
                    case 1:
                        _a = _c.sent(), recordIfNum = _a.recordIfNum, ConnectionMonitor = _a.ConnectionMonitor;
                        vendorIds = Object.keys(recordIfNum);
                        rules = "# Automatically generated by chan-dongle-extended.\n\n";
                        try {
                            for (vendorIds_1 = __values(vendorIds), vendorIds_1_1 = vendorIds_1.next(); !vendorIds_1_1.done; vendorIds_1_1 = vendorIds_1.next()) {
                                vendorId = vendorIds_1_1.value;
                                rules += [
                                    "ACTION==\"add\"",
                                    "ENV{ID_VENDOR_ID}==\"" + vendorId + "\"",
                                    "ENV{SUBSYSTEM}==\"tty\"",
                                    "ENV{ID_USB_INTERFACE_NUM}==\"[0-9]*\"",
                                    "MODE=\"0666\"",
                                    "GROUP=\"" + service_name + "\""
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
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (vendorIds_1_1 && !vendorIds_1_1.done && (_b = vendorIds_1.return)) _b.call(vendorIds_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        rules += [
                            "ACTION==\"add\"",
                            "ENV{DEVPATH}==\"/devices/virtual/tty/tnt[0-9]*\"",
                            "MODE=\"0660\"",
                            "GROUP=\"" + service_name + "\""
                        ].join(", ") + "\n";
                        fs.writeFileSync(rules_path, rules);
                        execSync("systemctl restart udev.service");
                        console.log(scriptLib.colorize("OK", "GREEN"));
                        execSync("chown " + service_name + ":" + service_name + " " + rules_path);
                        execSync("chown root:" + service_name + " /dev/tnt*");
                        execSync("chmod u+rw,g+rw /dev/tnt*");
                        return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                var monitor, _a, _b, accessPoint, _c, _d, device_path, e_2, _e, e_3, _f;
                                return __generator(this, function (_g) {
                                    switch (_g.label) {
                                        case 0:
                                            monitor = ConnectionMonitor.getInstance();
                                            console.log("Detecting currently connected modems ... ");
                                            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(function () { return resolve(); }, 4100); })];
                                        case 1:
                                            _g.sent();
                                            if (!monitor.connectedModems.size) {
                                                console.log("No modems currently connected.");
                                            }
                                            try {
                                                for (_a = __values(monitor.connectedModems), _b = _a.next(); !_b.done; _b = _a.next()) {
                                                    accessPoint = _b.value;
                                                    try {
                                                        for (_c = __values([accessPoint.audioIfPath, accessPoint.dataIfPath]), _d = _c.next(); !_d.done; _d = _c.next()) {
                                                            device_path = _d.value;
                                                            execSync("chown root:" + service_name + " " + device_path);
                                                            execSync("chmod u+rw,g+rw,o+rw " + device_path);
                                                        }
                                                    }
                                                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                                                    finally {
                                                        try {
                                                            if (_d && !_d.done && (_f = _c.return)) _f.call(_c);
                                                        }
                                                        finally { if (e_3) throw e_3.error; }
                                                    }
                                                }
                                            }
                                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                                            finally {
                                                try {
                                                    if (_b && !_b.done && (_e = _a.return)) _e.call(_a);
                                                }
                                                finally { if (e_2) throw e_2.error; }
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            }); })()];
                    case 2:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    udevRules.create = create;
    function remove(service_name) {
        var rules_path = make_rules_path(service_name);
        execSyncSilent("rm -rf " + rules_path);
        execSyncSilent("systemctl restart udev.service");
    }
    udevRules.remove = remove;
})(udevRules || (udevRules = {}));
program.parse(process.argv);
