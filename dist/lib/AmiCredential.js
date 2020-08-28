"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmiCredential = void 0;
var path = require("path");
var fs = require("fs");
var scriptLib = require("scripting-tools");
var installer_1 = require("../bin/installer");
var InstallOptions_1 = require("./InstallOptions");
var AmiCredential;
(function (AmiCredential) {
    AmiCredential.file_path = path.join(installer_1.working_directory_path, "asterisk_ami_credentials.json");
    function set(credential) {
        fs.writeFileSync(AmiCredential.file_path, Buffer.from(JSON.stringify(credential, null, 2), "utf8"));
        scriptLib.execSync("chmod 640 " + AmiCredential.file_path);
        var unix_user = InstallOptions_1.InstallOptions.get().unix_user;
        scriptLib.execSync("chown " + unix_user + ":" + unix_user + " " + AmiCredential.file_path);
    }
    AmiCredential.set = set;
    function get() {
        return require(AmiCredential.file_path);
    }
    AmiCredential.get = get;
})(AmiCredential = exports.AmiCredential || (exports.AmiCredential = {}));
