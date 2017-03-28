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
var gsm_modem_connection_1 = require("gsm-modem-connection");
var vendorIds = Object.keys(gsm_modem_connection_1.recordIfNum);
require("colors");
var systemdServicePath = "/etc/systemd/system/dongleExt.service";
var udevRulesPath = "/etc/udev/rules.d/99-dongleExt.rules";
program
    .version('0.0.1');
program
    .command("install-service")
    .description("Install dongleExt as a systemd service")
    .action(function () { return __awaiter(_this, void 0, void 0, function () {
    var node_execpath, user, group, service;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                node_execpath = process.argv[0];
                console.log([
                    "Now you will be ask to choose the user that will run the service\n",
                    "Be aware that this user need read access to /ect/asterisk/manager.conf",
                    " and read/write access to /etc/asterisk/dongles.conf"
                ].join("").yellow);
                return [4 /*yield*/, ask("User? (default root)")];
            case 1:
                user = _a.sent();
                return [4 /*yield*/, ask("Group? (default root)")];
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
            case 0: return [4 /*yield*/, runShellCommand("systemctl stop dongleExt.service")];
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
function runShellCommand(cmd) {
    var _a = cmd.split(" "), prog = _a[0], args = _a.slice(1);
    return new Promise(function (resolve) {
        child_process_1.spawn(prog, args).once("close", resolve);
    });
}
function runShellCommandAssertSuccess(cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var code;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, runShellCommand(cmd)];
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