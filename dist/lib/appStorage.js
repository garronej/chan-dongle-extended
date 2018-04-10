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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var runExclusive = require("run-exclusive");
var tt = require("transfer-tools");
var storage = require("node-persist");
var JSON_CUSTOM = tt.JSON_CUSTOM.get();
var defaultStorageData = {
    "pins": {},
    "messages": {}
};
var init = false;
var read_ = runExclusive.build(function (callback) { return __awaiter(_this, void 0, void 0, function () {
    var appData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!!init) return [3 /*break*/, 2];
                return [4 /*yield*/, storage.init({
                        "dir": "./app",
                        "parse": JSON_CUSTOM.parse,
                        "stringify": JSON_CUSTOM.stringify
                    })];
            case 1:
                _a.sent();
                init = true;
                _a.label = 2;
            case 2: return [4 /*yield*/, storage.getItem("appData")];
            case 3:
                appData = (_a.sent()) || defaultStorageData;
                callback(appData);
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(function () { return resolve(); }, 0); })];
            case 4:
                _a.sent();
                limitSize(appData);
                return [4 /*yield*/, storage.setItem("appData", appData)];
            case 5:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
function limitSize(appData) {
    for (var imsi in appData.messages) {
        appData.messages[imsi] = appData.messages[imsi].splice(-1000);
    }
}
function read() {
    return new Promise(function (resolve) { return read_(resolve); });
}
exports.read = read;
