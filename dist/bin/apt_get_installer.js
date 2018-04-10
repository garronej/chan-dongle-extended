"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
function apt_get_install(package_name, prog) {
    process.stdout.write("Checking for " + package_name + " package ... ");
    if (!!prog && apt_get_install.doesHaveProg(prog)) {
        console.log(prog + " executable found. OK");
        return;
    }
    if (apt_get_install.isPkgInstalled(package_name)) {
        console.log(package_name + " is installed. OK");
        return;
    }
    process.stdout.write("not found, installing ... ");
    try {
        if (apt_get_install.isFirst) {
            child_process_1.execSync("apt-get update");
            apt_get_install.isFirst = false;
        }
        child_process_1.execSync("apt-get -y install " + package_name);
    }
    catch (_a) {
        var message = _a.message;
        console.log("ERROR: " + message);
        process.exit(-1);
    }
    console.log("DONE");
}
exports.apt_get_install = apt_get_install;
(function (apt_get_install) {
    apt_get_install.isFirst = true;
    function isPkgInstalled(package_name) {
        try {
            console.assert(!!child_process_1.execSync("dpkg-query -W -f='${Status}' " + package_name + " 2>/dev/null")
                .toString("utf8")
                .match(/^install ok installed$/));
        }
        catch (_a) {
            return false;
        }
        return true;
    }
    apt_get_install.isPkgInstalled = isPkgInstalled;
    function doesHaveProg(prog) {
        try {
            child_process_1.execSync("which " + prog);
        }
        catch (_a) {
            return false;
        }
        return true;
    }
    apt_get_install.doesHaveProg = doesHaveProg;
})(apt_get_install = exports.apt_get_install || (exports.apt_get_install = {}));
function main() {
    console.log("---Installing required package for npm install---");
    apt_get_install("python", "python");
    //NOTE assume python 2 available. var range = semver.Range('>=2.5.0 <3.0.0')
    process.stdout.write("Checking for python module virtualenv ... ");
    try {
        child_process_1.execSync("which virtualenv");
        console.log("found. OK");
    }
    catch (_a) {
        process.stdout.write("not found, installing ... ");
        try {
            child_process_1.execSync("pip install virtualenv");
        }
        catch (_b) {
            var message = _b.message;
            console.log("ERROR: " + message);
            process.exit(-1);
        }
        console.log("DONE");
    }
    apt_get_install("build-essential");
    apt_get_install("libudev-dev");
    console.log("---DONE---");
}
if (require.main === module) {
    main();
}
