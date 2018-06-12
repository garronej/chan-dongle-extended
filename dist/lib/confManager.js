"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
var fs = require("fs");
var ini_extended_1 = require("ini-extended");
var runExclusive = require("run-exclusive");
var path = require("path");
var Astdirs_1 = require("./Astdirs");
var logger = require("logger");
var debug = logger.debugFactory();
var default_staticModuleConfiguration = {
    "general": {
        "interval": "10000000",
        "jbenable": "no"
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
        "disablesms": "yes",
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
function loadChanDongleSo(ami) {
    return __awaiter(this, void 0, void 0, function () {
        var response, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    debug("Checking if chan_dongle.so is loaded...");
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 5]);
                    return [4 /*yield*/, ami.postAction("ModuleCheck", {
                            "module": "chan_dongle.so"
                        })];
                case 2:
                    response = (_b.sent()).response;
                    if (response !== "Success") {
                        throw new Error("not loaded");
                    }
                    return [3 /*break*/, 5];
                case 3:
                    _a = _b.sent();
                    debug("chan_dongle.so is not loaded, loading manually");
                    return [4 /*yield*/, ami.postAction("ModuleLoad", {
                            "module": "chan_dongle.so",
                            "loadtype": "load"
                        })];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 5:
                    debug("chan_dongle.so is loaded!");
                    return [2 /*return*/];
            }
        });
    });
}
function getApi(ami) {
    return __awaiter(this, void 0, void 0, function () {
        var dongle_conf_path, staticModuleConfiguration, state, update, groupRef, api;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, loadChanDongleSo(ami)];
                case 1:
                    _a.sent();
                    ami.evt.attach(function (_a) {
                        var event = _a.event;
                        return event === "FullyBooted";
                    }, function () { return loadChanDongleSo(ami); });
                    dongle_conf_path = path.join(Astdirs_1.Astdirs.get().astetcdir, "dongle.conf");
                    staticModuleConfiguration = (function () {
                        try {
                            var _a = ini_extended_1.ini.parseStripWhitespace(fs.readFileSync(dongle_conf_path).toString("utf8")), general = _a.general, defaults = _a.defaults;
                            console.assert(!!general && !!defaults);
                            defaults.autodeletesms = default_staticModuleConfiguration.defaults["autodeletesms"];
                            general.interval = default_staticModuleConfiguration.general["interval"];
                            for (var key in defaults) {
                                if (!defaults[key]) {
                                    defaults[key] = default_staticModuleConfiguration.defaults[key];
                                }
                            }
                            return { general: general, defaults: defaults };
                        }
                        catch (_b) {
                            return default_staticModuleConfiguration;
                        }
                    })();
                    state = __assign({}, staticModuleConfiguration);
                    update = function () { return new Promise(function (resolve) { return fs.writeFile(dongle_conf_path, Buffer.from(ini_extended_1.ini.stringify(state), "utf8"), function (error) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if (error) {
                                throw error;
                            }
                            resolve();
                            ami.postAction("DongleReload", { "when": "gracefully" })
                                .catch(function () { return debug("Dongle reload fail, is asterisk running?"); });
                            return [2 /*return*/];
                        });
                    }); }); }); };
                    groupRef = runExclusive.createGroupRef();
                    api = {
                        staticModuleConfiguration: staticModuleConfiguration,
                        "reset": runExclusive.build(groupRef, function () { return __awaiter(_this, void 0, void 0, function () {
                            var e_1, _a, _b, _c, key;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        debug("reset");
                                        try {
                                            for (_b = __values(Object.keys(state).filter(function (key) { return key !== "general" && key !== "defaults"; })), _c = _b.next(); !_c.done; _c = _b.next()) {
                                                key = _c.value;
                                                delete state[key];
                                            }
                                        }
                                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                                        finally {
                                            try {
                                                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                                            }
                                            finally { if (e_1) throw e_1.error; }
                                        }
                                        return [4 /*yield*/, update()];
                                    case 1:
                                        _d.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }),
                        "addDongle": runExclusive.build(groupRef, function (_a) {
                            var dongleName = _a.dongleName, data = _a.data, audio = _a.audio;
                            return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            debug("addDongle", { dongleName: dongleName, data: data, audio: audio });
                                            state[dongleName] = { audio: audio, data: data };
                                            return [4 /*yield*/, update()];
                                        case 1:
                                            _b.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        }),
                        "removeDongle": runExclusive.build(groupRef, function (dongleName) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        debug("removeDongle", { dongleName: dongleName });
                                        delete state[dongleName];
                                        return [4 /*yield*/, update()];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })
                    };
                    api.reset();
                    return [2 /*return*/, api];
            }
        });
    });
}
exports.getApi = getApi;
