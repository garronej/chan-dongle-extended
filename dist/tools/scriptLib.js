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
Object.defineProperty(exports, "__esModule", { value: true });
var child_process = require("child_process");
var readline = require("readline");
function colorize(str, color) {
    var color_code = (function () {
        switch (color) {
            case "GREEN": return "\x1b[32m";
            case "RED": return "\x1b[31m";
            case "YELLOW": return "\x1b[33m";
        }
    })();
    return "" + color_code + str + "\u001B[0m";
}
exports.colorize = colorize;
function showLoad(message) {
    process.stdout.write(message + "... ");
    var moveBack = (function () {
        var cp = message.length + 3;
        return function () { return readline.cursorTo(process.stdout, cp); };
    })();
    var p = ["\\", "|", "/", "-"].map(function (i) { return colorize(i, "GREEN"); });
    var x = 0;
    var timer = setInterval(function () {
        moveBack();
        process.stdout.write(p[x++]);
        x = x % p.length;
    }, 250);
    var onComplete = function (message) {
        clearInterval(timer);
        moveBack();
        process.stdout.write(message + "\n");
    };
    return {
        "onError": function (errorMessage) { return onComplete(colorize(errorMessage, "RED")); },
        "onSuccess": function (message) { return onComplete(colorize(message || "ok", "GREEN")); }
    };
}
exports.showLoad = showLoad;
;
(function (showLoad) {
    function exec(cmd, onError) {
        return new Promise(function (resolve, reject) {
            return child_process.exec(cmd, function (error, stdout, stderr) {
                if (!!error) {
                    onError(colorize("error with unix command:", "RED") + " '" + cmd + "' message: " + error.message);
                    reject(error);
                }
                else {
                    resolve("" + stdout);
                }
            });
        });
    }
    showLoad.exec = exec;
})(showLoad = exports.showLoad || (exports.showLoad = {}));
function apt_get_install(package_name, prog) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, onSuccess, onError, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    process.stdout.write("Looking for " + package_name + " package ... ");
                    if (!!prog && apt_get_install.doesHaveProg(prog)) {
                        console.log(prog + " executable found. " + colorize("OK", "GREEN"));
                        return [2 /*return*/];
                    }
                    if (apt_get_install.isPkgInstalled(package_name)) {
                        console.log(package_name + " is installed. " + colorize("OK", "GREEN"));
                        return [2 /*return*/];
                    }
                    readline.clearLine(process.stdout, 0);
                    process.stdout.write("\r");
                    _a = showLoad("Installing " + package_name + " package"), onSuccess = _a.onSuccess, onError = _a.onError;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    if (!apt_get_install.isFirst) return [3 /*break*/, 3];
                    return [4 /*yield*/, showLoad.exec("apt-get update", onError)];
                case 2:
                    _b.sent();
                    apt_get_install.isFirst = false;
                    _b.label = 3;
                case 3: return [4 /*yield*/, showLoad.exec("apt-get -y install " + package_name, onError)];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _b.sent();
                    apt_get_install.onError(error_1);
                    throw error_1;
                case 6:
                    onSuccess("DONE");
                    return [2 /*return*/];
            }
        });
    });
}
exports.apt_get_install = apt_get_install;
(function (apt_get_install) {
    apt_get_install.onError = function (error) { throw error; };
    apt_get_install.isFirst = true;
    function isPkgInstalled(package_name) {
        try {
            console.assert(!!child_process.execSync("dpkg-query -W -f='${Status}' " + package_name + " 2>/dev/null")
                .toString("utf8")
                .match(/^install ok installed$/));
        }
        catch (_a) {
            return false;
        }
        return true;
    }
    apt_get_install.isPkgInstalled = isPkgInstalled;
    function doesHaveProg(prog) {
        try {
            child_process.execSync("which " + prog);
        }
        catch (_a) {
            return false;
        }
        return true;
    }
    apt_get_install.doesHaveProg = doesHaveProg;
})(apt_get_install = exports.apt_get_install || (exports.apt_get_install = {}));
