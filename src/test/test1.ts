
import * as log from "why-is-node-running";
import { DongleExtClient } from "../lib/client/AmiClient";


const client = DongleExtClient.getLocal();

/*
client.sendMessage(
    "353762037478870",
    "0636786385",
    "Message sent",
    (error, messageId) => {

        if (error)
            console.log(error);
        else console.log("MessageId: ", messageId);

        //client.disconnect();

    }
);
*/


client.evtMessageStatusReport.attach(
    statusReport => console.log("StatusReport: ", statusReport)
);

client.evtDongleDisconnect.attach(({ imei }) => console.log(`Dongle ${imei} has disconnected`));

client.evtNewActiveDongle.attach(({ imei }) => console.log(`New active dongle ${imei}`));

client.evtRequestUnlockCode.attach( requestUnlockCode => console.log("Request unlock code: ", requestUnlockCode));

client.getActiveDongles( dongles => {

    for( let imei of dongles ){
        console.log(`Dongle ${imei} connected`);
    }

});

client.getLockedDongles( dongles => {

    if( !Object.keys(dongles).length ){
        console.log("alldongle unlocked");
        return;
    }

    let imei= Object.keys(dongles)[0];

    console.assert(imei === "353762037478870");

    let { pinState, tryLeft } = dongles[imei];

    if( tryLeft === 1 ) return;

    client.unlockDongle(imei, "1234", error => {
        if( error ){
            console.log(error.message);
        }
    });


});

