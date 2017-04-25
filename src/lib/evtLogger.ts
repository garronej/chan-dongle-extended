import { DongleExtendedClient } from "chan-dongle-extended-client";

import * as _debug from "debug";
let debug= _debug("_evtLogger");

let client= DongleExtendedClient.localhost();

let logger= (evtName: string)=> {
    return data => debug(`${evtName}: ${JSON.stringify(data, null, 2)}`);
};


client.evtDongleDisconnect.attach(logger("evtDongleDisconnect"));
client.evtMessageStatusReport.attach(logger("evtMessageStatusReport"));
client.evtNewActiveDongle.attach(logger("evtNewActiveDongle"));
client.evtNewMessage.attach(logger("evtNewMessage"));
client.evtRequestUnlockCode.attach(logger("evtRequestUnlockCode"));