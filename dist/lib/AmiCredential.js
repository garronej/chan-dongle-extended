"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var fs = require("fs");
var scriptLib = require("scripting-tools");
var AmiCredential;
(function (AmiCredential) {
    AmiCredential.dir_path = ".";
    AmiCredential.file_name = "asterisk_ami_credentials.json";
    function set(credential, unix_user) {
        var file_path = path.join(AmiCredential.dir_path, AmiCredential.file_name);
        //TODO this file should be readonly for user
        fs.writeFileSync(file_path, Buffer.from(JSON.stringify(credential, null, 2), "utf8"));
        scriptLib.execSync("chmod 640 " + file_path);
        scriptLib.execSync("chown " + unix_user + ":" + unix_user + " " + file_path);
    }
    AmiCredential.set = set;
    function get() {
        return JSON.parse(fs.readFileSync(path.join(AmiCredential.dir_path, AmiCredential.file_name)).toString("utf8"));
    }
    AmiCredential.get = get;
})(AmiCredential = exports.AmiCredential || (exports.AmiCredential = {}));
