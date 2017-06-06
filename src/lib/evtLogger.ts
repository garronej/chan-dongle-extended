import { DongleExtendedClient } from "chan-dongle-extended-client";

import * as _debug from "debug";
let debug= _debug("_evtLogger");

for (let evtName of [
    "evtActiveDongleDisconnect",
    "evtLockedDongleDisconnect",
    "evtMessageStatusReport",
    "evtNewActiveDongle",
    "evtNewMessage",
    "evtRequestUnlockCode"
]) DongleExtendedClient.localhost()[evtName].attach(
    data => debug(`${evtName}: ${JSON.stringify(data, null, 2)}`)
);


