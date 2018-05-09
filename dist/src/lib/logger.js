"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var winston = require("winston");
var util = require("util");
var child_process_1 = require("child_process");
var current_log_filename = "current.log";
var logger = winston.createLogger({
    "format": winston.format.printf(function (_a) {
        var message = _a.message;
        return message;
    }),
    "transports": [
        new winston.transports.File({
            "level": "debug",
            "filename": current_log_filename,
            "maxsize": 1000000
        }),
        new winston.transports.Console({ "level": "info" })
    ]
});
function createCrashReport() {
    var crashReportRegexp = /^crash_report_([0-9]+)\.log$/;
    var crash_reports = child_process_1.execSync("ls")
        .toString("utf8")
        .split("\n")
        .filter(function (file_name) { return !!file_name.match(crashReportRegexp); })
        .sort(function (f1, f2) {
        var getTime = function (f) { return parseInt(f.match(crashReportRegexp)[1]); };
        return getTime(f1) - getTime(f2);
    });
    while (crash_reports.length > 4) {
        var crash_report = crash_reports.shift();
        child_process_1.execSync("rm " + crash_report);
    }
    child_process_1.execSync("mv " + current_log_filename + " crash_report_" + Date.now() + ".log");
}
exports.createCrashReport = createCrashReport;
function backupCurrentLog() {
    child_process_1.execSync("mv " + current_log_filename + " previous.log 2>/dev/null");
}
exports.backupCurrentLog = backupCurrentLog;
exports.log = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    logger.log({
        "level": "info",
        "message": util.format.apply(util.format, args)
    });
};
exports.fileOnlyLog = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    logger.log({
        "level": "debug",
        "message": util.format.apply(util.format, args)
    });
};
