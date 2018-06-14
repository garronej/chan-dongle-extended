import * as fs from "fs";
import { launch, beforeExit } from "../lib/launch";
import { VoidSyncEvent } from "ts-events-extended";
import * as scriptLib from "scripting-tools";
import * as logger from "logger";

const pidfile_path= "./chan_dongle.pid";
const logfile_path= "./current.log";

logger.file.enable(logfile_path, 900000);

fs.writeFileSync(pidfile_path, Buffer.from(process.pid.toString(), "utf8"));

let exitCode = 1;

process.once("SIGUSR2", () => {

    logger.log("Stop script called (SIGUSR2)");

    exitCode= 0;

    process.emit("beforeExit", NaN);

});

process.removeAllListeners("uncaughtException");

process.once("uncaughtException", error => {

    logger.log(error);

    process.emit("beforeExit", NaN);

});

process.removeAllListeners("unhandledRejection");

process.once("unhandledRejection", error => {

    logger.log(error);

    process.emit("beforeExit", NaN);

});

process.once("beforeExit", async () => {

    process.removeAllListeners("unhandledRejection");
    process.on("unhandledRejection", ()=> { });

    process.removeAllListeners("uncaughtException");
    process.on("uncaughtException", ()=> { });

    //log do not throw synchronously
    const prCleanLog= logger.log("---end---");

    const evtDone = new VoidSyncEvent();

    try {

        beforeExit()
            .then(() => evtDone.post())
            .catch(() => evtDone.post());

        await evtDone.waitFor(2000);

    } catch{ }

    try{ await prCleanLog; }catch{}

    if(  exitCode !== 0 ){

        try{ scriptLib.execSync(`cp ${logfile_path} ./previous_crash.log`); }catch{}

    }

    try{ fs.unlinkSync(logfile_path); }catch{}

    try{ fs.unlinkSync(pidfile_path); }catch{}

    process.exit(exitCode);

});

launch();
