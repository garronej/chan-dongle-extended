import * as i from "../bin/installer";
import * as path from "path";
import * as fs from "fs";
import * as scriptTools from "scripting-tools";
import * as logger from "logger";
import { InstallOptions } from "./InstallOptions";

const debug = logger.debugFactory();

const file_path = path.join(i.working_directory_path, "reboot_scheduled");

export function schedule() {

    if (InstallOptions.get().allow_host_reboot_on_dongle_unrecoverable_crash) {

        debug("Scheduling host for reboot");

        fs.writeFileSync(file_path, Buffer.from("1", "utf8"));

        process.emit("beforeExit", process.exitCode = 1);

    } else {

        debug("Install options does not stipulate that this program have permission to restart the host");

    }

}

export async function rebootIfScheduled() {

    if (!fs.existsSync(file_path)) {
        return;
    }

    fs.unlinkSync(file_path);

    debug("About to restart host");

    scriptTools.exec("reboot");

    await new Promise(_resolve => { });

}