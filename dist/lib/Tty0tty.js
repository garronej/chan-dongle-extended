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
var Tty0tty = (function () {
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
    return Tty0tty;
}());
Tty0tty.store = (function () {
    var out = [];
    for (var i = 0; i <= 6; i += 2)
        out.push(new Tty0tty("/dev/tnt" + i, "/dev/tnt" + (i + 1)));
    return out;
})();
exports.Tty0tty = Tty0tty;
//# sourceMappingURL=Tty0tty.js.map