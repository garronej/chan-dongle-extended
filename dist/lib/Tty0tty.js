"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process = require("child_process");
var Tty0tty = /** @class */ (function () {
    function Tty0tty(leftEnd, rightEnd) {
        this.leftEnd = leftEnd;
        this.rightEnd = rightEnd;
        this.available = true;
    }
    Tty0tty.makeFactory = function () {
        var store = (function () {
            //should return 24
            var pairCount = (child_process.execSync("ls /dev")
                .toString("utf8")
                .match(/(tnt[0-9]+)/g)
                .length) / 2;
            var out = [];
            var index = 0;
            while (!!(pairCount--)) {
                out.push(new Tty0tty("/dev/tnt" + index++, "/dev/tnt" + index++));
            }
            return out;
        })();
        return function () {
            var tty0tty = store.find(function (_a) {
                var available = _a.available;
                return available;
            });
            if (!tty0tty) {
                throw new Error("No more void modem available");
            }
            tty0tty.available = false;
            return tty0tty;
        };
    };
    Tty0tty.prototype.release = function () {
        this.available = true;
    };
    return Tty0tty;
}());
exports.Tty0tty = Tty0tty;
