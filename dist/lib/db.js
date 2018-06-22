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
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
var sqliteCustom = require("sqlite-custom");
var installer_1 = require("../bin/installer");
/** Must be called and awaited before use */
function launch() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, sqliteCustom.connectAndGetApi(installer_1.db_path, "HANDLE STRING ENCODING")];
                case 1:
                    exports._ = _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.launch = launch;
/** Debug only */
function flush() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports._.query([
                        "DELETE FROM pin",
                        "DELETE FROM message"
                    ].join(";\n"))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.flush = flush;
var pin;
(function (pin_1) {
    var AssociatedTo;
    (function (AssociatedTo) {
        var Iccid;
        (function (Iccid) {
            function match(associatedTo) {
                return !!associatedTo.iccid;
            }
            Iccid.match = match;
        })(Iccid = AssociatedTo.Iccid || (AssociatedTo.Iccid = {}));
        var Imei;
        (function (Imei) {
            function match(associatedTo) {
                return !Iccid.match(associatedTo);
            }
            Imei.match = match;
        })(Imei = AssociatedTo.Imei || (AssociatedTo.Imei = {}));
    })(AssociatedTo = pin_1.AssociatedTo || (pin_1.AssociatedTo = {}));
    function save(pin, associatedTo) {
        return __awaiter(this, void 0, void 0, function () {
            var sql;
            return __generator(this, function (_a) {
                sql = (function () {
                    if (!!pin) {
                        if (AssociatedTo.Iccid.match(associatedTo)) {
                            return exports._.buildInsertOrUpdateQueries("pin", {
                                "iccid": associatedTo.iccid,
                                "imei": null,
                                "value": pin
                            }, ["iccid"]);
                        }
                        else {
                            return exports._.buildInsertOrUpdateQueries("pin", {
                                "iccid": null,
                                "imei": associatedTo.imei,
                                "value": pin
                            }, ["imei"]);
                        }
                    }
                    else {
                        return [
                            "DELETE FROM pin WHERE",
                            AssociatedTo.Iccid.match(associatedTo) ?
                                "iccid=" + associatedTo.iccid :
                                "imei=" + associatedTo.imei
                        ].join(" ");
                    }
                })();
                return [2 /*return*/, exports._.query(sql)];
            });
        });
    }
    pin_1.save = save;
    function get(associatedTo) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exports._.query([
                            "SELECT value FROM pin WHERE",
                            AssociatedTo.Iccid.match(associatedTo) ?
                                "iccid=" + associatedTo.iccid :
                                "imei=" + associatedTo.imei
                        ].join(" "))];
                    case 1:
                        res = _a.sent();
                        if (res.length === 0) {
                            return [2 /*return*/, undefined];
                        }
                        else {
                            return [2 /*return*/, res[0]["value"]];
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    pin_1.get = get;
})(pin = exports.pin || (exports.pin = {}));
var messages;
(function (messages) {
    function retrieve(params) {
        return __awaiter(this, void 0, void 0, function () {
            var e_1, _a, fromDate, toDate, where_clause, sql, entries, res, entries_1, entries_1_1, entry;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        fromDate = params.fromDate ? params.fromDate.getTime() : 0;
                        toDate = params.toDate ? params.toDate.getTime() : Date.now();
                        where_clause = [
                            exports._.esc(fromDate) + " <= date AND date <= " + exports._.esc(toDate),
                            !!params.imsi ? " AND imsi= " + exports._.esc(params.imsi) : ""
                        ].join("");
                        sql = [
                            "SELECT imsi, date, number, text",
                            "FROM message",
                            "WHERE " + where_clause,
                            "ORDER BY date ASC;"
                        ].join("\n");
                        if (!!!params.flush) return [3 /*break*/, 2];
                        sql += "\n" + ("DELETE FROM message WHERE " + where_clause);
                        return [4 /*yield*/, exports._.query(sql)];
                    case 1:
                        res = _b.sent();
                        entries = res[0];
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, exports._.query(sql)];
                    case 3:
                        entries = _b.sent();
                        _b.label = 4;
                    case 4:
                        try {
                            for (entries_1 = __values(entries), entries_1_1 = entries_1.next(); !entries_1_1.done; entries_1_1 = entries_1.next()) {
                                entry = entries_1_1.value;
                                entry["date"] = new Date(entry["date"]);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (entries_1_1 && !entries_1_1.done && (_a = entries_1.return)) _a.call(entries_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        return [2 /*return*/, entries];
                }
            });
        });
    }
    messages.retrieve = retrieve;
    function save(imsi, message) {
        return __awaiter(this, void 0, void 0, function () {
            var sql;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = exports._.buildInsertQuery("message", {
                            imsi: imsi,
                            "date": message.date.getTime(),
                            "number": message.number,
                            "text": message.text
                        }, "THROW ERROR");
                        return [4 /*yield*/, exports._.query(sql)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    messages.save = save;
})(messages = exports.messages || (exports.messages = {}));
