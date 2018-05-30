
import * as db from "../lib/db";
import * as ttTesting from "transfer-tools/dist/lib/testing";
import assertSame = ttTesting.assertSame;
import { Message } from "ts-gsm-modem";

process.on("unhandledRejection", error => { throw error; });

db.launch().then(async ()=> {

    console.log("Start tests");

    await db.flush();

    const pin = "1234";

    await (async () => {

        const iccid = "22222222222222222";

        await db.pin.save("1234", { iccid });

        console.assert(
            pin === await db.pin.get({ iccid })
        );

        console.assert(
            undefined === await db.pin.get({ "iccid": "00000000" })
        );

        await db.pin.save(undefined, { iccid });

        console.assert(
            undefined === await db.pin.get({ iccid })
        );


    })();

    await (async () => {

        const imei = "111111111111111";

        await db.pin.save("1234", { imei });

        console.assert(
            pin === await db.pin.get({ imei })
        );

        console.assert(
            undefined === await db.pin.get({ "imei": "00000000" })
        );

        await db.pin.save(undefined, { imei });

        console.assert(
            undefined === await db.pin.get({ imei })
        );

    })();

    console.log("PASS PIN");

    const imsi_1= "123456789098765";
    const imsi_2= "111111111111111";

    const number = "0636786385";

    let timestamp = Date.now();

    const messages: Message[]= [
        { "date": new Date(timestamp++), number, "text": "foo bar" },
        { "date": new Date(timestamp++), number, "text": "hello word" },
        { "date": new Date(timestamp++), number, "text": "é^à😡" },
    ];

    for( let message of messages ){

        await db.messages.save(imsi_1, message);
        await db.messages.save(imsi_2, message );

    }

    assertSame(
        await db.messages.retrieve({
            "imsi": imsi_1,
            "fromDate": messages[1].date,
            "toDate": messages[2].date
        }),
        [ messages[1], messages[2] ].map( message => ({ ...message, "imsi": imsi_1 }))
    );

    assertSame(
        await db.messages.retrieve({
            "imsi": imsi_1,
            "fromDate": messages[0].date,
            "toDate": messages[2].date,
            "flush": true
        }),
        messages.map( message => ({ ...message, "imsi": imsi_1 }))
    );

    assertSame(
        await db.messages.retrieve({ "imsi": imsi_1 }),
        []
    );

    assertSame(
        await db.messages.retrieve({}),
        messages.map( message => ({ ...message, "imsi": imsi_2 }))
    );

    console.log("PASS MESSAGES");

    await db.flush();

});

