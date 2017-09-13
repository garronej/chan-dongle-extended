import { DongleExtendedClient } from "../chan-dongle-extended-client";

import * as _debug from "debug";
let debug= _debug("_evtLogger");

let client= DongleExtendedClient.localhost();

for( let evtName of Object.keys(client) ){

    if( !evtName.match(/^evt/) ) continue;

    debug(`displaying event: ${evtName}`);

    client[evtName].attach(
        data => debug(`${evtName}: ${JSON.stringify(data, null, 2)}`)
    );

}


