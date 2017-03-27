"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Tty0tty = (function () {
    function Tty0tty(leftEnd, rightEnd) {
        this.leftEnd = leftEnd;
        this.rightEnd = rightEnd;
        this.available = true;
    }
    Tty0tty.getPair = function () {
        for (var _i = 0, _a = this.store; _i < _a.length; _i++) {
            var pair = _a[_i];
            if (pair.available) {
                pair.available = false;
                return pair;
            }
        }
        throw new Error("No more void modem available");
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