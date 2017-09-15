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
Object.defineProperty(exports, "__esModule", { value: true });
var repl = require("repl");
var main_1 = require("./main");
require("colors");
var gsm_modem_connection_1 = require("gsm-modem-connection");
var context = repl.start({
    "terminal": true,
    "prompt": "> "
}).context;
Object.defineProperty(context, "exit", {
    "get": function () { return process.exit(0); }
});
Object.defineProperty(context, "accessPoints", {
    "get": function () { return gsm_modem_connection_1.Monitor.connectedModems; }
});
Object.defineProperty(context, "modem", {
    "get": function () { return main_1.activeModems.valuesAsArray()[0]; }
});
Object.assign(context, { activeModems: main_1.activeModems, lockedModems: main_1.lockedModems });
context.run = function (command) {
    return __awaiter(this, void 0, void 0, function () {
        var modem, _a, resp, final;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    modem = context.modem;
                    if (!modem) {
                        console.log("No active modem to run command on");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, modem.atStack.runCommand(command + "\r", { "recoverable": true, "retryOnErrors": false })];
                case 1:
                    _a = __read.apply(void 0, [_b.sent(), 2]), resp = _a[0], final = _a[1];
                    if (resp)
                        console.log(JSON.stringify(resp, null, 2));
                    if (final.isError)
                        console.log(JSON.stringify(final, null, 2).red);
                    else
                        console.log(final.raw.green);
                    return [2 /*return*/];
            }
        });
    });
};
