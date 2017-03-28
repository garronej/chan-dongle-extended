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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var readline = require("readline");
var fs_1 = require("fs");
var program = require("commander");
var path = require("path");
var gsm_modem_connection_1 = require("gsm-modem-connection");
var ini_extended_1 = require("ini-extended");
var chan_dongle_extended_client_1 = require("chan-dongle-extended-client");
var ChanDongleConfManager_1 = require("../lib/ChanDongleConfManager");
require("colors");
var vendorIds = Object.keys(gsm_modem_connection_1.recordIfNum);
var systemdServicePath = path.join("/etc", "systemd", "system", "dongleExt.service");
var udevRulesPath = path.join("/etc", "udev", "rules.d", "99-dongleExt.rules");
process.on("unhandledRejection", function (error) {
    console.log("INTERNAL ERROR INSTALLER");
    console.log(error);
    throw error;
});
program
    .version('0.0.1');
program
    .command("check-dependencies")
    .description("check that asterisk and chan_dongles are installed")
    .action(function () { return __awaiter(_this, void 0, void 0, function () {
    var code;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("Running check-dependencies");
                return [4 /*yield*/, runShellCommand("which asterisk")];
            case 1:
                code = _a.sent();
                if (code) {
                    console.log("Error: Seems like asterisk is not installed".red);
                    process.exit(-1);
                }
                if (!fs_1.existsSync(chan_dongle_extended_client_1.asteriskConfDirPath)) {
                    console.log(("Error: " + chan_dongle_extended_client_1.asteriskConfDirPath + " does not exist").red);
                    process.exit(-1);
                }
                if (!fs_1.existsSync(ChanDongleConfManager_1.dongleConfPath)) {
                    console.log(("Error: Seems like chan_dongle is not installed, " + ChanDongleConfManager_1.dongleConfPath + " does not exist").red);
                    process.exit(-1);
                }
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("enable-manager")
    .description("Enable asterisk manager if necessary and give write access to dongle.config")
    .action(function () { return __awaiter(_this, void 0, void 0, function () {
    var general, dongle_ext_user, needReload, error_1, config;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("Running enable-manager");
                general = {
                    "enabled": "yes",
                    "port": "5038",
                    "bindaddr": "127.0.0.1",
                    "displayconnects": "no"
                };
                dongle_ext_user = {
                    "secret": "foo_bar_baz",
                    "deny": "0.0.0.0/0.0.0.0",
                    "permit": "0.0.0.0/0.0.0.0",
                    "read": "system,user,config",
                    "write": "system,user,config",
                    "writetimeout": "5000"
                };
                needReload = false;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 2, , 4]);
                chan_dongle_extended_client_1.AmiCredential.retrieve();
                return [3 /*break*/, 4];
            case 2:
                error_1 = _a.sent();
                needReload = true;
                config = void 0;
                switch (error_1.message) {
                    case "NO_FILE":
                        config = { general: general, dongle_ext_user: dongle_ext_user };
                        break;
                    case "NO_USER":
                        config = __assign({}, ini_extended_1.ini.parseStripWhitespace(fs_1.readFileSync(chan_dongle_extended_client_1.managerConfPath, "utf8")), { dongle_ext_user: dongle_ext_user });
                        config.general.enabled = "yes";
                        break;
                    case "NOT_ENABLED":
                        config = ini_extended_1.ini.parseStripWhitespace(fs_1.readFileSync(chan_dongle_extended_client_1.managerConfPath, "utf8"));
                        config.general.enabled = "yes";
                        break;
                }
                return [4 /*yield*/, writeFileAssertSuccess(chan_dongle_extended_client_1.managerConfPath, ini_extended_1.ini.stringify(config))];
            case 3:
                _a.sent();
                return [3 /*break*/, 4];
            case 4:
                fs_1.chmodSync(chan_dongle_extended_client_1.managerConfPath, "775");
                fs_1.chmodSync(ChanDongleConfManager_1.dongleConfPath, "777");
                if (!needReload) return [3 /*break*/, 6];
                return [4 /*yield*/, runShellCommandAssertSuccess("asterisk -rx", ["core reload"])];
            case 5:
                _a.sent();
                console.log("Asterisk Manager successfully enabled");
                return [3 /*break*/, 7];
            case 6:
                console.log("Asterisk Manager was well configured already");
                _a.label = 7;
            case 7:
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("install-service")
    .description("Install dongleExt as a systemd service")
    .action(function () { return __awaiter(_this, void 0, void 0, function () {
    var node_execpath, user, group, service;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("Running install-service");
                node_execpath = process.argv[0];
                console.log([
                    "Now you will be ask to choose the user that will run the service\n",
                ].join("").yellow);
                return [4 /*yield*/, ask("User? (press enter for root)")];
            case 1:
                user = _a.sent();
                return [4 /*yield*/, ask("Group? (press enter for root)")];
            case 2:
                group = _a.sent();
                service = [
                    "[Unit]",
                    "Description=chan dongle extended service",
                    "After=network.target",
                    "",
                    "[Service]",
                    "ExecStart=" + node_execpath + " " + process.cwd() + "/dist/lib/main",
                    "WorkingDirectory=" + process.cwd(),
                    "Restart=always",
                    "RestartSec=10",
                    "StandardOutput=syslog",
                    "StandardError=syslog",
                    "SyslogIdentifier=DongleExt",
                    "User=" + (user || "root"),
                    "Group=" + (group || "root"),
                    "Environment=NODE_ENV=production DEBUG=_*",
                    "",
                    "[Install]",
                    "WantedBy=multi-user.target",
                    ""
                ].join("\n");
                return [4 /*yield*/, writeFileAssertSuccess(systemdServicePath, service)];
            case 3:
                _a.sent();
                return [4 /*yield*/, runShellCommandAssertSuccess("systemctl daemon-reload")];
            case 4:
                _a.sent();
                console.log([
                    "Chan dongle extended service installed!".green,
                    systemdServicePath + ": \n\n " + service,
                    "To run the service:".yellow,
                    "sudo systemctl start dongleExt.service",
                    "To automatically start the service on boot:".yellow,
                    "sudo systemctl enable dongleExt.service",
                ].join("\n"));
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("uninstall-service")
    .description("Remove dongleExt service from systemd ")
    .action(function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("Running uninstall-service");
                return [4 /*yield*/, runShellCommand("systemctl stop dongleExt.service")];
            case 1:
                _a.sent();
                return [4 /*yield*/, runShellCommand("systemctl disable dongleExt.service")];
            case 2:
                _a.sent();
                try {
                    fs_1.unlinkSync(systemdServicePath);
                }
                catch (error) { }
                return [4 /*yield*/, runShellCommandAssertSuccess("systemctl daemon-reload")];
            case 3:
                _a.sent();
                console.log("dongleExt.service removed from systemd".green);
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("set-udev-rules")
    .description("Set udev rules to automatically give write/write access to the connected dongles")
    .action(function () { return __awaiter(_this, void 0, void 0, function () {
    var rules, _i, vendorIds_1, vendorId, match;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("Running set-udev-rules");
                rules = "";
                for (_i = 0, vendorIds_1 = vendorIds; _i < vendorIds_1.length; _i++) {
                    vendorId = vendorIds_1[_i];
                    match = [
                        "ENV{ID_VENDOR_ID}==\"" + vendorId + "\", ",
                        "ENV{ID_USB_DRIVER}!=\"usb-storage\", ",
                        "ENV{ID_USB_INTERFACE_NUM}==\"[0-9]*\", "
                    ].join("");
                    rules += match + "ACTION==\"add\" MODE=\"0666\", GROUP=\"root\"\n";
                }
                return [4 /*yield*/, writeFileAssertSuccess(udevRulesPath, rules)];
            case 1:
                _a.sent();
                return [4 /*yield*/, runShellCommandAssertSuccess("systemctl restart udev.service")];
            case 2:
                _a.sent();
                console.log(("Success: Rules wrote in " + udevRulesPath + ":\n\n" + rules).green);
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("remove-udev-rules")
    .description("remove udev rules for changing permission on connected dongles")
    .action(function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("Running remove-udev-rules");
                try {
                    fs_1.unlinkSync(udevRulesPath);
                }
                catch (error) { }
                return [4 /*yield*/, runShellCommandAssertSuccess("systemctl restart udev.service")];
            case 1:
                _a.sent();
                console.log("Rules successfully uninstalled".green);
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program.parse(process.argv);
function runShellCommand(cmd, extraArgs) {
    var _a = cmd.split(" "), prog = _a[0], args = _a.slice(1);
    if (extraArgs)
        args = args.concat(extraArgs);
    return new Promise(function (resolve) { return child_process_1.spawn(prog, args).once("close", resolve); });
}
function runShellCommandAssertSuccess(cmd, extraArgs) {
    return __awaiter(this, void 0, void 0, function () {
        var code;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, runShellCommand(cmd, extraArgs)];
                case 1:
                    code = _a.sent();
                    if (code !== 0) {
                        console.log(("Error: " + cmd + " fail").red);
                        return [2 /*return*/, process.exit(code)];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
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
function writeFileAssertSuccess(filename, data) {
    return new Promise(function (resolve) { return fs_1.writeFile(filename, data, { "encoding": "utf8", "flag": "w" }, function (error) {
        if (error) {
            console.log(("Error: Failed to write " + filename + ": " + error.message).red);
            process.exit(1);
        }
        resolve();
    }); });
}
//# sourceMappingURL=dongleExtInstaller.js.map