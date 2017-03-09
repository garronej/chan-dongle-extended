import * as log from "why-is-node-running";
import { AmiClient } from "../lib/client/AmiClient";


const client = AmiClient.getLocal();

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

client.evtRequestUnlockCode.attach(requestUnlockCode => console.log("Request unlock code: ", requestUnlockCode));

client.getActiveDongles(dongles => {

    if (!Object.keys(dongles).length)
        return console.log("No active dongle");

    for (let imei of dongles) {

        console.log(`Dongle ${imei} connected`);

        client.sendMessage(
            imei,
            "0636786385",
            "Yo Yo Yo Yo!",
            (error, messageId) => {

                if (error)
                    console.log(error);
                else console.log("MessageId: ", messageId);

                //client.disconnect();

            }
        );


    }



});

client.getLockedDongles(dongles => {

    if (!Object.keys(dongles).length) {
        console.log("alldongle unlocked");
        return;
    }

    console.log("Locked dongles: ", dongles);

    let imei = Object.keys(dongles)[0];

    console.assert(imei === "353762037478870");

    let { pinState, tryLeft } = dongles[imei];

    if (tryLeft === 1) return;

    client.unlockDongle(imei, "1234", error => {
        if (error) {
            console.log(error.message);
        }

        console.log("unlock success");
    });


});

