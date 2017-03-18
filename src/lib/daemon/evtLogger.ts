import { AmiClient } from "../client/AmiClient";

import * as _debug from "debug";
let debug= _debug("_evtLogger");

let amiClient= AmiClient.localhost();

let logger= (evtName: string)=> {
    return data => debug(`${evtName}: ${JSON.stringify(data, null, 2)}`);
};

amiClient.evtDongleDisconnect.attach(logger("evtDongleDisconnect"));
amiClient.evtMessageStatusReport.attach(logger("evtMessageStatusReport"));
amiClient.evtNewActiveDongle.attach(logger("evtNewActiveDongle"));
amiClient.evtNewMessage.attach(logger("evtNewMessage"));
amiClient.evtRequestUnlockCode.attach(logger("evtRequestUnlockCode"));