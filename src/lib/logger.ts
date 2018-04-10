import * as winston from "winston";
import * as util from "util";
import { execSync } from "child_process";

const current_log_filename = "current.log";

const logger = winston.createLogger({
    "format": winston.format.printf(({ message }) => message),
    "transports": [
        new winston.transports.File({
            "level": "debug",
            "filename": current_log_filename,
            "maxsize": 1000000
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {

    logger.add(
        new winston.transports.Console({ "level": "info" })
    );

}

export function clearCurrentLog() {

    try {

        execSync(`mv ${current_log_filename} previous.log 2>/dev/null`);

    } catch{ }

}

export function backupCurrentLog() {

    let crashReportRegexp = /^crash_report_([0-9]+)\.log$/;

    let crash_reports = `${execSync("ls")}`
        .split("\n")
        .filter(file_name => !!file_name.match(crashReportRegexp))
        .sort((f1, f2) => {

            let getTime = (f: string) => parseInt(f.match(crashReportRegexp)![1]);

            return getTime(f1) - getTime(f2);

        })
        ;

    while (crash_reports.length > 4) {

        let crash_report = crash_reports.shift();

        execSync(`rm ${crash_report}`);

    }

    execSync(`cp ${current_log_filename} crash_report_${Date.now()}.log`);

}

export const log: typeof console.log = (...args) => {

    logger.log({
        "level": "info",
        "message": util.format.apply(util.format, args)
    });

};

export const fileOnlyLog: typeof console.log = (...args) => {

    logger.log({
        "level": "debug",
        "message": util.format.apply(util.format, args)
    });

};
