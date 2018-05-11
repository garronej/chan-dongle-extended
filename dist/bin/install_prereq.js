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
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var readline = require("readline");
var scriptLib = require("../tools/scriptLib");
var path = require("path");
scriptLib.exit_if_not_root();
exports.module_dir_path = path.join(__dirname, "..", "..");
exports.pkg_list_path = path.join(exports.module_dir_path, "pkg_installed.json");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("---Installing required package for npm install---");
                    scriptLib.apt_get_install.onError = function () { return process.exit(-1); };
                    scriptLib.apt_get_install.onInstallSuccess = function (package_name) {
                        return scriptLib.apt_get_install.record_installed_package(exports.pkg_list_path, package_name);
                    };
                    return [4 /*yield*/, scriptLib.apt_get_install("python", "python")];
                case 1:
                    _a.sent();
                    //NOTE assume python 2 available. var range = semver.Range('>=2.5.0 <3.0.0')
                    return [4 /*yield*/, scriptLib.apt_get_install("python-pip", "pip")];
                case 2:
                    //NOTE assume python 2 available. var range = semver.Range('>=2.5.0 <3.0.0')
                    _a.sent();
                    return [4 /*yield*/, (function installVirtualenv() {
                            return __awaiter(this, void 0, void 0, function () {
                                var _a, _b, onSuccess, onError, _c;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0:
                                            process.stdout.write("Checking for python module virtualenv ... ");
                                            _d.label = 1;
                                        case 1:
                                            _d.trys.push([1, 2, , 7]);
                                            child_process_1.execSync("which virtualenv");
                                            return [3 /*break*/, 7];
                                        case 2:
                                            _a = _d.sent();
                                            readline.clearLine(process.stdout, 0);
                                            process.stdout.write("\r");
                                            _b = scriptLib.showLoad("Installing virtualenv"), onSuccess = _b.onSuccess, onError = _b.onError;
                                            _d.label = 3;
                                        case 3:
                                            _d.trys.push([3, 5, , 6]);
                                            return [4 /*yield*/, scriptLib.showLoad.exec("pip install virtualenv", onError)];
                                        case 4:
                                            _d.sent();
                                            return [3 /*break*/, 6];
                                        case 5:
                                            _c = _d.sent();
                                            process.exit(-1);
                                            return [3 /*break*/, 6];
                                        case 6:
                                            onSuccess("DONE");
                                            return [2 /*return*/];
                                        case 7:
                                            console.log("found. " + scriptLib.colorize("OK", "GREEN"));
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        })()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, scriptLib.apt_get_install("build-essential")];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, scriptLib.apt_get_install("libudev-dev")];
                case 5:
                    _a.sent();
                    console.log("---DONE---");
                    return [2 /*return*/];
            }
        });
    });
}
;
if (require.main === module) {
    main();
}
