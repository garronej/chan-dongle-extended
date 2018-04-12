import { execSync } from "child_process";
import * as readline from "readline";
import * as scriptLib from "../tools/scriptLib";


(async function main() {

    console.log("---Installing required package for npm install---");

    scriptLib.apt_get_install.onError= ()=> process.exit(-1);

    await scriptLib.apt_get_install("python", "python");
    //NOTE assume python 2 available. var range = semver.Range('>=2.5.0 <3.0.0')

    await (async function installVirtualenv() {

        process.stdout.write(`Checking for python module virtualenv ... `);

        try {

            execSync(`which virtualenv`);

        } catch{

            readline.clearLine(process.stdout, 0);
            process.stdout.write("\r");

            let { onSuccess, onError } = scriptLib.showLoad("Installing virtualenv");

            try {

                await scriptLib.showLoad.exec(`pip install virtualenv`, onError);

            } catch {

                process.exit(-1);

            }

            onSuccess("DONE");

            return;

        }

        console.log(`found. ${scriptLib.colorize("OK", "GREEN")}`);

    })();

    await scriptLib.apt_get_install("build-essential");

    await scriptLib.apt_get_install("libudev-dev");

    console.log("---DONE---");

})();