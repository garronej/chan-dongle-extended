"use strict";
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
var c = require("./_constants");
var Tty0tty = /** @class */ (function () {
    function Tty0tty(leftEnd, rightEnd) {
        this.leftEnd = leftEnd;
        this.rightEnd = rightEnd;
        this.available = true;
    }
    Tty0tty.getPair = function () {
        try {
            for (var _a = __values(this.store), _b = _a.next(); !_b.done; _b = _a.next()) {
                var pair = _b.value;
                if (pair.available) {
                    pair.available = false;
                    return pair;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_1) throw e_1.error; }
        }
        throw new Error("No more void modem available");
        var e_1, _c;
    };
    Tty0tty.prototype.release = function () {
        this.available = true;
    };
    Tty0tty.store = (function () {
        var out = [];
        var index = 0;
        try {
            for (var _a = __values(new Array(c.tty0ttyPairCount)), _b = _a.next(); !_b.done; _b = _a.next()) {
                var _ = _b.value;
                out.push(new Tty0tty("/dev/tnt" + index++, "/dev/tnt" + index++));
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return out;
        var e_2, _c;
    })();
    return Tty0tty;
}());
exports.Tty0tty = Tty0tty;
