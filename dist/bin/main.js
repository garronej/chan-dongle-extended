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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var launch_1 = require("../lib/launch");
var ts_events_extended_1 = require("ts-events-extended");
var scriptLib = require("scripting-tools");
var logger = require("logger");
var pidfile_path = "./chan_dongle.pid";
var logfile_path = "./current.log";
logger.file.enable(logfile_path, 900000);
fs.writeFileSync(pidfile_path, Buffer.from(process.pid.toString(), "utf8"));
process.once("SIGUSR2", function () {
    logger.log("Stop script called (SIGUSR2)");
    exitCode = 0;
    process.emit("beforeExit", NaN);
});
process.removeAllListeners("uncaughtException");
process.once("uncaughtException", function (error) {
    logger.log(error);
    process.emit("beforeExit", NaN);
});
process.removeAllListeners("unhandledRejection");
process.once("unhandledRejection", function (error) {
    logger.log(error);
    process.emit("beforeExit", NaN);
});
var exitCode = 1;
process.once("beforeExit", function () { return __awaiter(_this, void 0, void 0, function () {
    var prCleanLog, evtDone, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                process.removeAllListeners("unhandledRejection");
                process.on("unhandledRejection", function () { });
                process.removeAllListeners("uncaughtException");
                process.on("uncaughtException", function () { });
                prCleanLog = logger.log("---end---");
                evtDone = new ts_events_extended_1.VoidSyncEvent();
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                launch_1.beforeExit()
                    .then(function () { return evtDone.post(); })
                    .catch(function () { return evtDone.post(); });
                return [4 /*yield*/, evtDone.waitFor(2000)];
            case 2:
                _c.sent();
                return [3 /*break*/, 4];
            case 3:
                _a = _c.sent();
                return [3 /*break*/, 4];
            case 4:
                _c.trys.push([4, 6, , 7]);
                return [4 /*yield*/, prCleanLog];
            case 5:
                _c.sent();
                return [3 /*break*/, 7];
            case 6:
                _b = _c.sent();
                return [3 /*break*/, 7];
            case 7:
                if (exitCode !== 0) {
                    try {
                        scriptLib.execSync("cp " + logfile_path + " ./previous_crash.log");
                    }
                    catch (_d) { }
                }
                try {
                    fs.unlinkSync(logfile_path);
                }
                catch (_e) { }
                try {
                    fs.unlinkSync(pidfile_path);
                }
                catch (_f) { }
                process.exit(exitCode);
                return [2 /*return*/];
        }
    });
}); });
launch_1.launch();
