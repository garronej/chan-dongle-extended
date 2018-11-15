import * as i from "../bin/installer";
import * as path from "path";
import * as fs from "fs";
import * as scriptTools from "scripting-tools";
import * as logger from "logger";

const debug = logger.debugFactory();

const file_path = path.join(i.working_directory_path, "reboot_scheduled");

export function schedule(){

    debug("Scheduling host for reboot");

    fs.writeFileSync(file_path, Buffer.from("1", "utf8"));

    process.emit("beforeExit", process.exitCode = 1);

}

export async function rebootIfScheduled(){

    if( !fs.existsSync(file_path) ){
        return;
    }

    fs.unlinkSync(file_path);


    debug("About to restart host");

    scriptTools.exec("reboot");

    await new Promise(_resolve=> {});

}