"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var repl = require("repl");
var main_1 = require("./main");
var replSession = undefined;
main_1.activeModems.evtDelete.attach(function (_a) {
    var _ = _a[0], imei = _a[1];
    if (replSession && replSession.imei === imei) {
        replSession.value.close();
        replSession = undefined;
    }
});
main_1.activeModems.evtSet.attach(function (_a) {
    var modem = _a[0].modem, imei = _a[1];
    if (replSession)
        return;
    var value = repl.start({
        "terminal": true,
        "prompt": "> "
    });
    Object.assign(value.context, {
        modem: modem,
        run: function (command) {
            modem.atStack.runCommand(command + "\r", { "recoverable": true, "retryOnErrors": false }, function (resp, final) {
                if (resp)
                    console.log(JSON.stringify(resp, null, 2));
                if (final.isError)
                    console.log(JSON.stringify(final, null, 2).red);
                else
                    console.log(final.raw.green);
            });
            return "COMMAND QUEUED";
        }
    });
    replSession = { imei: imei, value: value };
});
//# sourceMappingURL=repl.js.map