"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var fs = require("fs");
var AmiCredential;
(function (AmiCredential) {
    AmiCredential.dir_path = ".";
    AmiCredential.file_name = "asterisk_ami_credentials.json";
    function set(credential) {
        fs.writeFileSync(path.join(AmiCredential.dir_path, AmiCredential.file_name), Buffer.from(JSON.stringify(credential, null, 2), "utf8"));
    }
    AmiCredential.set = set;
    function get() {
        return JSON.parse(fs.readFileSync(path.join(AmiCredential.dir_path, AmiCredential.file_name)).toString("utf8"));
    }
    AmiCredential.get = get;
})(AmiCredential = exports.AmiCredential || (exports.AmiCredential = {}));
