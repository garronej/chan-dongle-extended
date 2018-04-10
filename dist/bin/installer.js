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
var child_process_1 = require("child_process");
var fs = require("fs");
var path = require("path");
var apt_get_installer_1 = require("./apt_get_installer");
var localsManager = require("../lib/localsManager");
require("colors");
var node_path = process.argv[0];
var module_path = path.join(__dirname, "..", "..");
var _a = __read((function () {
    var bind_dir_path = path.join(module_path, "dist", "bin");
    return [
        path.join(bind_dir_path, "cli.js"),
        path.join(bind_dir_path, "main.js")
    ];
})(), 2), cli_path = _a[0], main_path = _a[1];
var working_directory_path = path.join(module_path, "working_directory");
var _install = program.command("install").description("install");
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
    var locals, key, _a, astetcdir, astsbindir, astmoddir, astrundir;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("---Installing chan-dongle-extended---");
                if (fs.existsSync(working_directory_path)) {
                    console.log("already installed".red);
                    process.exit(-1);
                }
                locals = __assign({}, localsManager.Locals.defaults);
                for (key in localsManager.Locals.defaults) {
                    if (options[key] !== undefined) {
                        locals[key] = options[key];
                    }
                }
                locals.build_across_linux_kernel = "" + child_process_1.execSync("uname -r");
                _a = localsManager.get.readAstdirs(locals.astetcdir), astetcdir = _a.astetcdir, astsbindir = _a.astsbindir, astmoddir = _a.astmoddir, astrundir = _a.astrundir;
                unixUser.create(locals.service_name);
                workingDirectory.create(locals.service_name);
                (function () {
                    var local_path = path.join(working_directory_path, localsManager.file_name);
                    fs.writeFileSync(local_path, Buffer.from(JSON.stringify(locals, null, 2), "utf8"));
                    child_process_1.execSync("chown " + locals.service_name + ":" + locals.service_name + " " + local_path);
                })();
                tty0tty.install();
                return [4 /*yield*/, udevRules.create(locals.service_name)];
            case 1:
                _b.sent();
                createShellScripts(locals.service_name, astsbindir);
                systemd.create(locals.service_name);
                grantDongleConfigFileAccess(astetcdir, locals.service_name);
                return [4 /*yield*/, enableAsteriskManager(locals.service_name, astetcdir, locals.ami_port, astsbindir, astrundir)];
            case 2:
                _b.sent();
                console.log("---DONE---");
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("uninstall")
    .action(function () { return __awaiter(_this, void 0, void 0, function () {
    var locals, message, message, message, message, message, message, message;
    return __generator(this, function (_a) {
        console.log("---Uninstalling chan-dongle-extended---");
        locals = localsManager.get(working_directory_path).locals;
        try {
            process.stdout.write("Stopping service ... ");
            child_process_1.execSync("systemctl stop " + locals.service_name);
            console.log("ok".green);
        }
        catch (_b) {
            message = _b.message;
            console.log(message.red);
        }
        try {
            child_process_1.execSync("pkill -u " + locals.service_name);
        }
        catch (_c) { }
        try {
            process.stdout.write("Removing cli tool symbolic link ... ");
            child_process_1.execSync("rm $(which " + locals.service_name + ")");
            console.log("ok".green);
        }
        catch (_d) {
            message = _d.message;
            console.log(message.red);
        }
        try {
            process.stdout.write("Removing systemd service ... ");
            systemd.remove(locals.service_name);
            ;
            console.log("ok".green);
        }
        catch (_e) {
            message = _e.message;
            console.log(message.red);
        }
        try {
            process.stdout.write("Removing udev rules ... ");
            udevRules.remove(locals.service_name);
            console.log("ok".green);
        }
        catch (_f) {
            message = _f.message;
            console.log(message.red);
        }
        try {
            process.stdout.write("Removing tty0tty kernel module ...");
            tty0tty.remove();
            console.log("ok".green + " ( need reboot )");
        }
        catch (_g) {
            message = _g.message;
            console.log(message.red);
        }
        try {
            process.stdout.write("Removing app working directory ... ");
            workingDirectory.remove();
            console.log("ok".green);
        }
        catch (_h) {
            message = _h.message;
            console.log(message.red);
        }
        try {
            process.stdout.write("Deleting unix user ... ");
            unixUser.remove(locals.service_name);
            console.log("ok".green);
        }
        catch (_j) {
            message = _j.message;
            console.log(message.red);
        }
        console.log("---DONE---");
        process.exit(0);
        return [2 /*return*/];
    });
}); });
var tty0tty;
(function (tty0tty) {
    var load_module_file_path = "/etc/modules";
    function install() {
        process.stdout.write("Checking for linux kernel headers ...");
        try {
            child_process_1.execSync("ls /lib/modules/$(uname -r)/build 2>/dev/null");
            console.log("found, OK".green);
        }
        catch (_a) {
            process.stdout.write("not found ...");
            try {
                console.assert(!!("" + child_process_1.execSync("cat /etc/os-release")).match(/^NAME=.*Raspbian.*$/m));
                apt_get_installer_1.apt_get_install("raspberrypi-kernel-headers");
            }
            catch (_b) {
                apt_get_installer_1.apt_get_install("linux-headers-$(uname -r)");
            }
        }
        apt_get_installer_1.apt_get_install("git", "git");
        console.log("Building and installing tty0tty kernel module >>>");
        try {
            var tty0tty_dir_path = path.join(working_directory_path, "tty0tty");
            var tty0tty_module_dir_path = path.join(tty0tty_dir_path, "module");
            child_process_1.execSync("git clone https://github.com/garronej/tty0tty " + tty0tty_dir_path);
            child_process_1.execSync("make --directory=" + tty0tty_module_dir_path);
            child_process_1.execSync("cp " + path.join(tty0tty_module_dir_path, "tty0tty.ko") + " /lib/modules/$(uname -r)/kernel/drivers/misc/");
            child_process_1.execSync("depmod");
            child_process_1.execSync("modprobe tty0tty");
            try {
                child_process_1.execSync("cat " + load_module_file_path + " | grep tty0tty");
            }
            catch (_c) {
                child_process_1.execSync("echo tty0tty >> " + load_module_file_path);
            }
        }
        catch (_d) {
            var message = _d.message;
            console.log(message.red);
            process.exit(-1);
        }
        console.log("<<< tty0tty successfully installed".green);
    }
    tty0tty.install = install;
    function remove() {
        fs.writeFileSync(load_module_file_path, Buffer.from(("" + fs.readFileSync(load_module_file_path)).replace("tty0tty", ""), "utf8"));
        child_process_1.execSync("rm -f /lib/modules/$(uname -r)/kernel/drivers/misc/tty0tty.ko");
    }
    tty0tty.remove = remove;
})(tty0tty || (tty0tty = {}));
var workingDirectory;
(function (workingDirectory) {
    function create(service_name) {
        process.stdout.write("Creating app working directory '" + working_directory_path + "' ... ");
        child_process_1.execSync("mkdir " + working_directory_path);
        child_process_1.execSync("chown " + service_name + ":" + service_name + " " + working_directory_path);
        console.log("ok".green);
    }
    workingDirectory.create = create;
    function remove() {
        child_process_1.execSync("rm -r " + working_directory_path);
    }
    workingDirectory.remove = remove;
})(workingDirectory || (workingDirectory = {}));
var unixUser;
(function (unixUser) {
    function create(service_name) {
        process.stdout.write("Creating unix user '" + service_name + "' ... ");
        child_process_1.execSync("useradd -M " + service_name + " -s /bin/false -d " + working_directory_path);
        console.log("ok".green);
    }
    unixUser.create = create;
    function remove(service_name) {
        child_process_1.execSync("userdel " + service_name);
    }
    unixUser.remove = remove;
})(unixUser || (unixUser = {}));
function grantDongleConfigFileAccess(astetcdir, service_name) {
    var dongle_path = path.join(astetcdir, "dongle.conf");
    process.stdout.write("Granting write access to " + service_name + " on '" + dongle_path + "' ... ");
    child_process_1.execSync("touch " + dongle_path);
    child_process_1.execSync("chown " + service_name + ":" + service_name + " " + dongle_path);
    child_process_1.execSync("chmod u+rw " + dongle_path);
    console.log("ok".green);
}
function createShellScripts(service_name, astsbindir) {
    process.stdout.write("Creating launch scripts ... ");
    var writeAndSetPerms = function (script_path, script) {
        fs.writeFileSync(script_path, Buffer.from(script, "utf8"));
        child_process_1.execSync("chown " + service_name + ":" + service_name + " " + script_path);
        child_process_1.execSync("chmod +x " + script_path);
    };
    createShellScripts.wait_ast_sh_path = path.join(working_directory_path, "wait_ast.sh");
    writeAndSetPerms(createShellScripts.wait_ast_sh_path, [
        "#!/usr/bin/env bash",
        "",
        "until " + path.join(astsbindir, "asterisk") + " -rx \"core waitfullybooted\"",
        "do",
        "   sleep 3",
        "done",
        "pkill -u " + service_name + " || true",
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
        "sudo su -s $(which bash) -c \"" + node_path + " " + cli_path + " $args\" " + service_name,
        ""
    ].join("\n"));
    child_process_1.execSync("ln -s " + cli_sh_path + " " + path.join(astsbindir, service_name));
    writeAndSetPerms(path.join(working_directory_path, "main.sh"), [
        "#!/usr/bin/env bash",
        "",
        "systemctl stop " + service_name,
        "cd " + working_directory_path,
        "args=$@",
        "" + createShellScripts.wait_ast_sh_path,
        "su -s $(which bash) -c \"" + node_path + " " + main_path + " $args\" " + service_name,
        ""
    ].join("\n"));
    console.log("ok".green);
}
(function (createShellScripts) {
})(createShellScripts || (createShellScripts = {}));
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
            "ExecStartPre=" + createShellScripts.wait_ast_sh_path,
            "ExecStart=" + node_path + " " + main_path,
            "Environment=NODE_ENV=production",
            "PermissionsStartOnly=true",
            "StandardOutput=journal",
            "WorkingDirectory=" + working_directory_path,
            "Restart=always",
            "RestartSec=10",
            "User=" + service_name,
            "Group=" + service_name,
            "",
            "[Install]",
            "WantedBy=multi-user.target",
            ""
        ].join("\n");
        fs.writeFileSync(service_path, Buffer.from(service, "utf8"));
        child_process_1.execSync("systemctl daemon-reload");
        child_process_1.execSync("systemctl enable " + service_name + " --quiet");
        console.log("ok".green);
    }
    systemd.create = create;
    function remove(service_name) {
        try {
            child_process_1.execSync("systemctl disable " + service_name + " --quiet");
            fs.unlinkSync(get_service_path(service_name));
        }
        catch (_a) { }
        child_process_1.execSync("systemctl daemon-reload");
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
                        child_process_1.execSync("chown " + service_name + ":" + service_name + " " + manager_path);
                    }
                    child_process_1.execSync("chmod +r " + manager_path);
                    if (fs.existsSync(path.join(astrundir, "asterisk.ctl"))) {
                        child_process_1.execSync(path.join(astsbindir, "asterisk") + " -rx \"core reload\"");
                    }
                    console.log("ok".green);
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
                        child_process_1.execSync("mkdir -p " + path.dirname(rules_path));
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
                        child_process_1.execSync("systemctl restart udev.service");
                        console.log("ok".green);
                        child_process_1.execSync("chown " + service_name + ":" + service_name + " " + rules_path);
                        child_process_1.execSync("chown root:" + service_name + " /dev/tnt*");
                        child_process_1.execSync("chmod u+rw,g+rw /dev/tnt*");
                        return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                var monitor, _a, _b, accessPoint, _c, _d, device_path, e_2, _e, e_3, _f;
                                return __generator(this, function (_g) {
                                    switch (_g.label) {
                                        case 0:
                                            monitor = ConnectionMonitor.getInstance();
                                            process.stdout.write("Detecting currently connected modems ... ");
                                            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(function () { return resolve(); }, 4100); })];
                                        case 1:
                                            _g.sent();
                                            if (!monitor.connectedModems.size) {
                                                console.log("No modems currently connected.");
                                            }
                                            try {
                                                for (_a = __values(monitor.connectedModems), _b = _a.next(); !_b.done; _b = _a.next()) {
                                                    accessPoint = _b.value;
                                                    console.log("Detected modem currently connected: \n", accessPoint.toString());
                                                    try {
                                                        for (_c = __values([accessPoint.audioIfPath, accessPoint.dataIfPath]), _d = _c.next(); !_d.done; _d = _c.next()) {
                                                            device_path = _d.value;
                                                            child_process_1.execSync("chown root:" + service_name + " " + device_path);
                                                            child_process_1.execSync("chmod u+rw,g+rw,o+rw " + device_path);
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
        child_process_1.execSync("rm -rf " + rules_path);
        child_process_1.execSync("systemctl restart udev.service");
    }
    udevRules.remove = remove;
})(udevRules || (udevRules = {}));
program.parse(process.argv);
