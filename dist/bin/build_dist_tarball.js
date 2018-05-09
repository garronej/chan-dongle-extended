#!/usr/bin/env node
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
exports.module_dir_path = path.join(__dirname, "..", "..");
function execSyncInherit(cmd, options) {
    if (options === void 0) { options = {}; }
    console.log(scriptLib.colorize("$ " + cmd, "YELLOW") + "\n");
    child_process.execSync(cmd, __assign({ "stdio": "inherit" }, options));
}
exports.execSyncInherit = execSyncInherit;
function find_module_path(module_name, root_module_path) {
    var cmd = [
        "dirname $(",
        "find " + path.join(root_module_path, "node_modules") + " ",
        "-type f -path \\*/node_modules/" + module_name + "/package.json",
        ")"
    ].join("");
    var match = child_process
        .execSync(cmd, { "stdio": [] })
        .toString("utf8")
        .split("\n");
    match.pop();
    if (!match.length) {
        throw new Error("Not found");
    }
    else {
        return match.sort(function (a, b) { return a.length - b.length; })[0];
    }
}
exports.find_module_path = find_module_path;
var working_directory_path = path.join(exports.module_dir_path, "working_directory");
if (require.main === module) {
    var dist_dir_name_1 = [
        "dongle",
        "v" + require(path.join(exports.module_dir_path, "package.json"))["version"],
        child_process.execSync("uname -m").toString("utf8").replace("\n", "")
    ].join("_");
    console.log({ dist_dir_name: dist_dir_name_1 });
    var dist_dir_path_1 = path.join(working_directory_path, dist_dir_name_1);
    (function () {
        var tmp_dir_path = path.join("/tmp", dist_dir_name_1);
        execSyncInherit("rm -rf " + tmp_dir_path);
        execSyncInherit("cp -r " + exports.module_dir_path + " " + tmp_dir_path);
        execSyncInherit("rm -rf " + dist_dir_path_1);
        execSyncInherit("mv " + tmp_dir_path + " " + dist_dir_path_1);
    })();
    execSyncInherit("cp " + path.join(working_directory_path, "node") + " " + dist_dir_path_1);
    (function () {
        var node_python_messaging_path = find_module_path("node-python-messaging", dist_dir_path_1);
        execSyncInherit("rm -r " + path.join(node_python_messaging_path, "dist", "virtual"));
    })();
    (function () {
        var udev_module_path = find_module_path("udev", dist_dir_path_1);
        execSyncInherit("rm -r " + path.join(udev_module_path, "build"));
    })();
    try {
        for (var _a = __values([".git", ".gitignore", "src", "tsconfig.json"]), _b = _a.next(); !_b.done; _b = _a.next()) {
            var name = _b.value;
            execSyncInherit("rm -r " + path.join(dist_dir_path_1, name));
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
            execSyncInherit("rm -r " + path.join(dist_dir_path_1, "node_modules", name));
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_e && !_e.done && (_f = _d.return)) _f.call(_d);
        }
        finally { if (e_2) throw e_2.error; }
    }
    execSyncInherit("find " + path.join(dist_dir_path_1, "node_modules") + " -type f -name \"*.ts\" -exec rm -rf {} \\;");
    execSyncInherit("rm -r " + path.join(dist_dir_path_1, path.basename(working_directory_path)));
    execSyncInherit("tar -czf " + path.join(working_directory_path, dist_dir_name_1 + ".tar.gz") + " -C " + dist_dir_path_1 + " .");
    execSyncInherit("rm -r " + dist_dir_path_1);
    console.log("---DONE---");
    //mkdir foo
    //tar -xzf bar.tar.gz -C foo
    // /usr/share
}
var e_1, _c, e_2, _f;
