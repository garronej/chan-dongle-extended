#!/usr/bin/env node
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
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
var path = require("path");
var build_dist_tarball_1 = require("./build_dist_tarball");
var fs = require("fs");
var node_path = path.join(build_dist_tarball_1.module_dir_path, "node");
var bin_dir_path = path.join(build_dist_tarball_1.module_dir_path, "dist", "bin");
var args = (function () {
    var out = __spread(process.argv);
    out.shift();
    out.shift();
    return out.map(function (v) { return "\"" + v + "\""; }).join(" ");
})();
var runInstaller = function () { return build_dist_tarball_1.execSyncInherit(node_path + " " + path.join(bin_dir_path, "installer.js") + " install " + args); };
if (!!args.match(/\-\-help/) || !!args.match(/\-h/)) {
    runInstaller();
    process.exit(0);
}
build_dist_tarball_1.execSyncInherit(node_path + " " + path.join(bin_dir_path, "install_prereq"));
(function build_udev() {
    var udev_dir_path = build_dist_tarball_1.find_module_path("udev", build_dist_tarball_1.module_dir_path);
    if (fs.existsSync(path.join(udev_dir_path, "build"))) {
        return;
    }
    var pre_gyp_dir_path = "";
    try {
        for (var _a = __values([udev_dir_path, build_dist_tarball_1.module_dir_path]), _b = _a.next(); !_b.done; _b = _a.next()) {
            var root_module_path = _b.value;
            try {
                pre_gyp_dir_path = build_dist_tarball_1.find_module_path("node-pre-gyp", root_module_path);
                break;
            }
            catch (_c) { }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
        }
        finally { if (e_1) throw e_1.error; }
    }
    build_dist_tarball_1.execSyncInherit([
        "PATH=" + path.join(build_dist_tarball_1.module_dir_path) + ":$PATH",
        "node " + path.join(pre_gyp_dir_path, "bin", "node-pre-gyp") + " install",
        "--fallback-to-build"
    ].join(" "), { "cwd": udev_dir_path });
    var e_1, _d;
})();
(function postinstall_node_python_messaging() {
    var node_python_messaging_dir_path = build_dist_tarball_1.find_module_path("node-python-messaging", build_dist_tarball_1.module_dir_path);
    if (fs.existsSync(path.join(node_python_messaging_dir_path, "dist", "virtual"))) {
        return;
    }
    build_dist_tarball_1.execSyncInherit("./install-python-dep.sh", { "cwd": node_python_messaging_dir_path });
})();
runInstaller();
