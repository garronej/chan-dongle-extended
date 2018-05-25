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
var fs = require("fs");
fs.writeFileSync("./chan_dongle.pid", Buffer.from(process.pid.toString(), "utf8"));
var launch_1 = require("../lib/launch");
var logger_1 = require("../lib/logger");
var ts_events_extended_1 = require("ts-events-extended");
function cleanupAndExit(code) {
    return __awaiter(this, void 0, void 0, function () {
        var evtDone, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    logger_1.log("cleaning up and exiting with code " + code);
                    evtDone = new ts_events_extended_1.VoidSyncEvent();
                    launch_1.beforeExit().then(function () { return evtDone.post(); }).catch(function () { return evtDone.post(); });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, evtDone.waitFor(2000)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4:
                    if (code !== 0) {
                        logger_1.log("Create crash report");
                        try {
                            logger_1.createCrashReport();
                        }
                        catch (_c) { }
                    }
                    else {
                        logger_1.log("Backup log");
                        try {
                            logger_1.backupCurrentLog();
                        }
                        catch (_d) { }
                    }
                    try {
                        fs.unlinkSync("./chan_dongle.pid");
                    }
                    catch (_e) { }
                    process.exit(code);
                    return [2 /*return*/];
            }
        });
    });
}
//Ctrl+C
process.once("SIGINT", function () {
    logger_1.log("Ctrl+C pressed ( SIGINT )");
    cleanupAndExit(2);
});
process.once("SIGUSR2", function () {
    logger_1.log("Stop script called (SIGUSR2)");
    cleanupAndExit(0);
});
process.once("beforeExit", function (code) { return cleanupAndExit(code); });
process.removeAllListeners("uncaughtException");
process.once("uncaughtException", function (error) {
    logger_1.log("uncaughtException", error);
    cleanupAndExit(-1);
});
process.removeAllListeners("unhandledRejection");
process.once("unhandledRejection", function (error) {
    logger_1.log("unhandledRejection", error);
    cleanupAndExit(-1);
});
launch_1.launch();
