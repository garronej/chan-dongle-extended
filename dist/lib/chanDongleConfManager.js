"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var ini_extended_1 = require("ini-extended");
var runExclusive = require("run-exclusive");
var path = require("path");
var ts_ami_1 = require("ts-ami");
var chan_dongle_extended_client_1 = require("chan-dongle-extended-client");
var astConfPath = path.join("/etc", "asterisk");
var dongleConfPath = path.join(astConfPath, "dongle.conf");
var _debug = require("debug");
var debug = _debug("_ChanDongleConfManager");
exports.defaultConfig = {
    "general": {
        "interval": "10000000",
        "jbenable": "no",
        "jbmaxsize": "100",
        "jbimpl": "fixed"
    },
    "defaults": {
        "context": "from-dongle",
        "group": "0",
        "rxgain": "0",
        "txgain": "0",
        "autodeletesms": "no",
        "resetdongle": "yes",
        "u2diag": "-1",
        "usecallingpres": "yes",
        "callingpres": "allowed_passed_screen",
        "disablesms": "no",
        "language": "en",
        "smsaspdu": "yes",
        "mindtmfgap": "45",
        "mindtmfduration": "80",
        "mindtmfinterval": "200",
        "callwaiting": "auto",
        "disable": "no",
        "initstate": "start",
        "exten": "+12345678987",
        "dtmf": "relax"
    }
};
var config = undefined;
var chanDongleConfManager;
(function (chanDongleConfManager) {
    var _this = this;
    var groupRef = runExclusive.createGroupRef();
    function getConfig() {
        if (!config)
            config = loadConfig();
        return config;
    }
    chanDongleConfManager.getConfig = getConfig;
    chanDongleConfManager.reset = runExclusive.build(groupRef, function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!config)
                        config = loadConfig();
                    return [4 /*yield*/, update()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    chanDongleConfManager.addDongle = runExclusive.build(groupRef, function (_a) {
        var dongleName = _a.dongleName, data = _a.data, audio = _a.audio;
        return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!config)
                            config = loadConfig();
                        /*
                        config[dongleName] = {
                            "audio": audio,
                            "data": data,
                            "rxgain": "20",
                            "txgain": "-20"
                        };
                        */
                        config[dongleName] = { audio: audio, data: data };
                        return [4 /*yield*/, update()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    });
    chanDongleConfManager.removeDongle = runExclusive.build(groupRef, function (dongleName) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!config)
                        config = loadConfig();
                    delete config[dongleName];
                    return [4 /*yield*/, update()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
})(chanDongleConfManager = exports.chanDongleConfManager || (exports.chanDongleConfManager = {}));
function update() {
    var _this = this;
    return new Promise(function (resolve) { return fs_1.writeFile(dongleConfPath, ini_extended_1.ini.stringify(config), { "encoding": "utf8", "flag": "w" }, function (error) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (error)
                        throw error;
                    return [4 /*yield*/, reloadChanDongle()];
                case 1:
                    _a.sent();
                    resolve();
                    return [2 /*return*/];
            }
        });
    }); }); });
}
function reloadChanDongle() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ts_ami_1.Ami.localhost({ "user": chan_dongle_extended_client_1.amiUser }).postAction("DongleReload", { "when": "gracefully" })];
                case 1:
                    _a.sent();
                    debug("update chan_dongle config");
                    return [2 /*return*/];
            }
        });
    });
}
exports.reloadChanDongle = reloadChanDongle;
function loadConfig() {
    try {
        var _a = ini_extended_1.ini.parseStripWhitespace(fs_1.readFileSync(dongleConfPath, "utf8")), general = _a.general, defaults = _a.defaults;
        defaults.autodeletesms = "false";
        defaults.disablesms = "no";
        general.interval = "10000";
        return { general: general, defaults: defaults };
    }
    catch (error) {
        return exports.defaultConfig;
    }
}
