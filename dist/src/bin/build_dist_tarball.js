#!/usr/bin/env node
"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("rejection-tracker").main(__dirname, "..", "..");
var child_process = require("child_process");
var scriptLib = require("../tools/scriptLib");
var path = require("path");
var execSync = function (cmd) {
    console.log(scriptLib.colorize("$ " + cmd, "YELLOW") + "\n");
    child_process.execSync(cmd, { "stdio": "inherit" });
};
var module_path = path.join(__dirname, "..", "..");
var working_directory_path = path.join(module_path, "working_directory");
var dist_dir_name = [
    "dongle",
    "v" + require(path.join(module_path, "package.json"))["version"],
    child_process.execSync("uname -m").toString("utf8").replace("\n", "")
].join("_");
console.log("updated");
console.log({ dist_dir_name: dist_dir_name });
var dist_dir_path = path.join(working_directory_path, dist_dir_name);
(function () {
    var tmp_dir_path = path.join("/tmp", dist_dir_name);
    execSync("rm -rf " + tmp_dir_path);
    execSync("cp -r " + module_path + " " + tmp_dir_path);
    execSync("rm -rf " + dist_dir_path);
    execSync("mv " + tmp_dir_path + " " + dist_dir_path);
})();
execSync("cp " + path.join(working_directory_path, "node") + " " + dist_dir_path);
var find_module_path = function (module_name) {
    return child_process
        .execSync("dirname $(find " + path.join(dist_dir_path, "node_modules") + " -type f -path */node_modules/" + module_name + "/package.json)")
        .toString("utf8")
        .replace("\n", "");
};
(function () {
    var node_python_messaging_path = find_module_path("node-python-messaging");
    console.log({ node_python_messaging_path: node_python_messaging_path });
    execSync("rm -r " + path.join(node_python_messaging_path, "dist", "virtual"));
})();
(function () {
    var udev_module_path = find_module_path("udev");
    execSync("rm -r " + path.join(udev_module_path, "build"));
})();
try {
    for (var _a = __values([".git", ".gitignore", "src", "tsconfig.json"]), _b = _a.next(); !_b.done; _b = _a.next()) {
        var name = _b.value;
        execSync("rm -r " + path.join(dist_dir_path, name));
    }
}
catch (e_1_1) { e_1 = { error: e_1_1 }; }
finally {
    try {
        if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
    }
    finally { if (e_1) throw e_1.error; }
}
try {
    for (var _d = __values(["@types", "typescript"]), _e = _d.next(); !_e.done; _e = _d.next()) {
        var name = _e.value;
        execSync("rm -r " + path.join(dist_dir_path, "node_modules", name));
    }
}
catch (e_2_1) { e_2 = { error: e_2_1 }; }
finally {
    try {
        if (_e && !_e.done && (_f = _d.return)) _f.call(_d);
    }
    finally { if (e_2) throw e_2.error; }
}
execSync("find " + path.join(dist_dir_path, "node_modules") + " -type f -name \"*.ts\" -exec rm -rf {} \\;");
execSync("rm -r " + path.join(dist_dir_path, path.basename(working_directory_path)));
execSync("tar zcvf " + path.join(working_directory_path, dist_dir_name + ".tar.gz") + " " + dist_dir_path);
//execSync(`rm -r ${dist_dir_path}`);
console.log("---DONE---");
var e_1, _c, e_2, _f;
