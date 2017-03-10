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

client.evtNewMessage.attach(message => console.log("New Message: ", message));

client.getActiveDongles(dongles => {

    if (!Object.keys(dongles).length)
        return console.log("No active dongle");

    for (let imei of dongles) {

        console.log(`Dongle ${imei} connected`);

        client.sendMessage(
            imei,
            "0636786385",
            "Un message\n plus commpliquer | alors @ ou pas",
            (error, messageId) => {

                if (error)
                    console.log(error);
                else console.log("MessageId: ", messageId);

                //client.disconnect();

            }
        );

        client.createContact(
            imei,
            "Sim Free",
            "+33769365812",
            (error, contact) => {

                console.log("Created Contact: ", contact!);

                client.getSimPhonebook(imei, (error, contacts) => console.log("Phonebook", JSON.stringify(contacts, null, 2)));

                client.deleteContact(imei, contact!.index, error => {

                    console.log("after remove contact");

                    client.getSimPhonebook(imei, (error, contacts) => console.log("Phonebook", JSON.stringify(contacts, null, 2)));


                })


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


    let { pinState, tryLeft } = dongles[imei];

    if (tryLeft === 1) return;

    console.log("unlocking dongle", imei);

    client.unlockDongle(imei, "1234", error => {
        if (error) {
            console.log(error.message);
        }

        console.log("unlock success");
    });


});

