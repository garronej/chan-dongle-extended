
import * as fs from "fs";

fs.writeFileSync("./chan_dongle.pid", Buffer.from(process.pid.toString(), "utf8"));

import { launch, beforeExit } from "../lib/launch";
import { log, backupCurrentLog, createCrashReport } from "../lib/logger";
import { VoidSyncEvent } from "ts-events-extended";

async function cleanupAndExit(code: number) {

    log(`cleaning up and exiting with code ${code}`);

    const evtDone = new VoidSyncEvent();

    beforeExit().then(() => evtDone.post()).catch(() => evtDone.post());

    try { await evtDone.waitFor(2000); } catch{ }

    if (code !== 0) {

        log("Create crash report");

        try{ createCrashReport(); } catch{}

    } else {

        log("Backup log");

        try{ backupCurrentLog(); } catch{}

    }

    try{ fs.unlinkSync("./chan_dongle.pid"); }catch{}

    process.exit(code);

}

//Ctrl+C
process.once("SIGINT", () => {

    log("Ctrl+C pressed ( SIGINT )");

    cleanupAndExit(2);

});

process.once("SIGUSR2", () => {

    log("Stop script called (SIGUSR2)");

    cleanupAndExit(0);

});

process.once("beforeExit", code => cleanupAndExit(code));

process.removeAllListeners("uncaughtException");

process.once("uncaughtException", error => {

    log("uncaughtException", error);

    cleanupAndExit(-1);

});

process.removeAllListeners("unhandledRejection");

process.once("unhandledRejection", error => {

    log("unhandledRejection", error);

    cleanupAndExit(-1);

});

launch();
