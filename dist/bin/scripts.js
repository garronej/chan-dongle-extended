#!/usr/bin/env node
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
var c = require("../lib/_constants");
require("rejection-tracker").main(c.paths.dirs.project);
var path = require("path");
var child_process_1 = require("child_process");
var readline = require("readline");
var fs_1 = require("fs");
var program = require("commander");
var gsm_modem_connection_1 = require("gsm-modem-connection");
var vendorIds = Object.keys(gsm_modem_connection_1.recordIfNum);
var ini_extended_1 = require("ini-extended");
var chanDongleConfManager_1 = require("../lib/chanDongleConfManager");
require("colors");
var chan_dongle_extended_client_1 = require("../chan-dongle-extended-client");
var amiUser = chan_dongle_extended_client_1.misc.amiUser;
program
    .command("postinstall")
    .description([
    "Checks that Asterisk and chan_dongle and tty0tty are installed",
    "Create udev rules for granting R/W access on dongles on connect",
    "and disable the wwan network interface created by the dongles",
    "Enable Asterisk Manager and create a user for this module",
    "Register a systemd service: " + c.serviceName + ".service"
].join(" "))
    .action(function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, checkDependencies()];
            case 1:
                _a.sent();
                return [4 /*yield*/, setUdevRules()];
            case 2:
                _a.sent();
                return [4 /*yield*/, enableManager()];
            case 3:
                _a.sent();
                return [4 /*yield*/, mkPersistDir()];
            case 4:
                _a.sent();
                return [4 /*yield*/, installService()];
            case 5:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("prestart")
    .description("Reset chan_dongle, give perms to dev/tnt* devices (tty0tty)")
    .action(function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            //TODO: make sure mysql and Asterisk started
            return [4 /*yield*/, resetChanDongle()];
            case 1:
                //TODO: make sure mysql and Asterisk started
                _a.sent();
                return [4 /*yield*/, grantAccessTntDevices()];
            case 2:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("poststop")
    .description("Reset chan_dongle")
    .action(function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, resetChanDongle()];
            case 1:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("preuninstall")
    .description("Remove systemd service, remove udev rules")
    .action(function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, removeService()];
            case 1:
                _a.sent();
                return [4 /*yield*/, removeUdevRules()];
            case 2:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program.parse(process.argv);
function installService() {
    return __awaiter(this, void 0, void 0, function () {
        var node_execpath, user, _a, group, _b, service;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    node_execpath = process.argv[0];
                    console.log([
                        "Now you will be ask to choose the user that will run the service\n",
                    ].join("").yellow);
                    _a = c.user;
                    if (_a) return [3 /*break*/, 2];
                    return [4 /*yield*/, ask("User? (press enter for root)")];
                case 1:
                    _a = (_c.sent());
                    _c.label = 2;
                case 2:
                    user = _a || "root";
                    _b = c.group;
                    if (_b) return [3 /*break*/, 4];
                    return [4 /*yield*/, ask("Group? (press enter for root)")];
                case 3:
                    _b = (_c.sent());
                    _c.label = 4;
                case 4:
                    group = _b || "root";
                    service = [
                        "[Unit]",
                        "Description=chan dongle extended service",
                        "After=network.target",
                        "",
                        "[Service]",
                        "ExecStartPre=" + node_execpath + " " + __filename + " prestart",
                        "ExecStart=" + node_execpath + " " + c.paths.dirs.project + "/dist/lib/main",
                        "ExecStopPost=" + node_execpath + " " + __filename + " poststop",
                        "PermissionsStartOnly=true",
                        "WorkingDirectory=" + c.paths.dirs.project,
                        "Restart=always",
                        "RestartSec=10",
                        "StandardOutput=syslog",
                        "StandardError=syslog",
                        "SyslogIdentifier=DongleExt",
                        "User=" + user,
                        "Group=" + group,
                        "Environment=NODE_ENV=production DEBUG=_*",
                        "",
                        "[Install]",
                        "WantedBy=multi-user.target",
                        ""
                    ].join("\n");
                    return [4 /*yield*/, writeFileAssertSuccess(c.paths.files.systemdServiceFile, service)];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, run("systemctl daemon-reload")];
                case 6:
                    _c.sent();
                    console.log([
                        "Chan dongle extended service installed!".green,
                        c.paths.files.systemdServiceFile + ": \n\n " + service,
                        "To run the service:".yellow,
                        "sudo systemctl start " + c.serviceName,
                        "To automatically start the service on boot:".yellow,
                        "sudo systemctl enable " + c.serviceName,
                    ].join("\n"));
                    return [2 /*return*/];
            }
        });
    });
}
function mkPersistDir() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, run("mkdir -p " + c.paths.dirs.persist)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, run("chmod 777 " + c.paths.dirs.persist)];
                case 2:
                    _a.sent();
                    console.log("Persist dir created");
                    return [2 /*return*/];
            }
        });
    });
}
function enableManager() {
    return __awaiter(this, void 0, void 0, function () {
        var general, user, managerConfPath, error_1, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    general = {
                        "enabled": "yes",
                        "port": "5038",
                        "bindaddr": "127.0.0.1",
                        "displayconnects": "yes"
                    };
                    user = {
                        "secret": "" + Date.now(),
                        "deny": "0.0.0.0/0.0.0.0",
                        "permit": "0.0.0.0/0.0.0.0",
                        //"read": "system,user,config,agi",
                        "read": "all",
                        //"write": "system,user,config,agi",
                        "write": "all",
                        "writetimeout": "5000"
                    };
                    managerConfPath = path.join(c.paths.dirs.asterisk, "manager.conf");
                    if (fs_1.existsSync(managerConfPath)) {
                        try {
                            general = ini_extended_1.ini.parseStripWhitespace(fs_1.readFileSync(managerConfPath, "utf8")).general;
                            general.enabled = "yes";
                        }
                        catch (error) { }
                    }
                    return [4 /*yield*/, writeFileAssertSuccess(managerConfPath, ini_extended_1.ini.stringify((_a = { general: general }, _a[amiUser] = user, _a)))];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, run("chmod u+r,g+r,o+r " + managerConfPath)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, run('asterisk -rx "core reload"')];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _b.sent();
                    return [3 /*break*/, 6];
                case 6:
                    console.log("Asterisk Manager successfully enabled");
                    return [2 /*return*/];
            }
        });
    });
}
function setUdevRules() {
    return __awaiter(this, void 0, void 0, function () {
        var rules, vendorIds_1, vendorIds_1_1, vendorId, e_1, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
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
                                "GROUP=\"root\""
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
                            if (vendorIds_1_1 && !vendorIds_1_1.done && (_a = vendorIds_1.return)) _a.call(vendorIds_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    return [4 /*yield*/, writeFileAssertSuccess(c.paths.files.udevRules, rules)];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, run("systemctl restart udev.service")];
                case 2:
                    _b.sent();
                    console.log(("Success: Rules wrote in " + c.paths.files.udevRules + ":\n\n" + rules).green);
                    return [2 /*return*/];
            }
        });
    });
}
function grantAccessTntDevices() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, run("chmod 777 /dev/tnt*")];
                case 1:
                    _a.sent();
                    console.log("access tnt* devices granted");
                    return [2 /*return*/];
            }
        });
    });
}
function checkDependencies() {
    return __awaiter(this, void 0, void 0, function () {
        var error_2, error_3, chanDongleModulePath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("in check dependencies");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, run("cat /etc/modules | grep tty0tty")];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.log("Error: Seems like tty0tty is not installed");
                    process.exit(-1);
                    return [3 /*break*/, 4];
                case 4:
                    console.log("tty0tty ok");
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, run("which asterisk")];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    error_3 = _a.sent();
                    console.log("Error: Seems like asterisk is not installed".red);
                    process.exit(-1);
                    return [3 /*break*/, 8];
                case 8:
                    if (!fs_1.existsSync(c.paths.dirs.asterisk)) {
                        console.log(("Error: " + c.paths.dirs.asterisk + " does not exist").red);
                        process.exit(-1);
                    }
                    console.log("asterisk ok");
                    chanDongleModulePath = path.join("/usr", "lib", "asterisk", "modules", "chan_dongle.so");
                    if (!fs_1.existsSync(chanDongleModulePath)) {
                        console.log(("Error: Seems like chan_dongle is not installed, " + chanDongleModulePath + " does not exist").red);
                        process.exit(-1);
                    }
                    console.log("chan_dongle ok");
                    return [2 /*return*/];
            }
        });
    });
}
function resetChanDongle() {
    return __awaiter(this, void 0, void 0, function () {
        var dongleConfPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, chanDongleConfManager_1.chanDongleConfManager.reset()];
                case 1:
                    _a.sent();
                    dongleConfPath = path.join(c.paths.dirs.asterisk, "dongle.conf");
                    return [4 /*yield*/, run("chmod u+rw,g+rw,o+rw " + dongleConfPath)];
                case 2:
                    _a.sent();
                    console.log("chan dongle has been reset");
                    return [2 /*return*/];
            }
        });
    });
}
function removeUdevRules() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    try {
                        fs_1.unlinkSync(c.paths.files.udevRules);
                    }
                    catch (error) { }
                    return [4 /*yield*/, run("systemctl restart udev.service")];
                case 1:
                    _a.sent();
                    console.log("Rules successfully uninstalled".green);
                    return [2 /*return*/];
            }
        });
    });
}
function removeService() {
    return __awaiter(this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, run("systemctl stop " + c.serviceName + ".service")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, run("systemctl disable " + c.serviceName + ".service")];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    return [3 /*break*/, 4];
                case 4:
                    try {
                        fs_1.unlinkSync(c.paths.files.systemdServiceFile);
                    }
                    catch (error) { }
                    return [4 /*yield*/, run("systemctl daemon-reload")];
                case 5:
                    _a.sent();
                    console.log((c.serviceName + ".service removed from systemd").green);
                    return [2 /*return*/];
            }
        });
    });
}
function run(command) {
    return new Promise(function (resolve, reject) {
        child_process_1.exec(command, function (error, stdout) {
            if (error) {
                reject(new Error(error.message));
                return;
            }
            resolve(stdout);
        });
    });
}
exports.run = run;
function ask(question) {
    var rl = readline.createInterface({
        "input": process.stdin,
        "output": process.stdout
    });
    return new Promise(function (resolve) {
        rl.question(question + "\n> ", function (answer) {
            resolve(answer);
            rl.close();
        });
    });
}
exports.ask = ask;
function writeFileAssertSuccess(filename, data) {
    return new Promise(function (resolve) { return fs_1.writeFile(filename, data, { "encoding": "utf8", "flag": "w" }, function (error) {
        if (error) {
            console.log(("Error: Failed to write " + filename + ": " + error.message).red);
            process.exit(1);
        }
        resolve();
    }); });
}
exports.writeFileAssertSuccess = writeFileAssertSuccess;
