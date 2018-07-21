#!/usr/bin/env node

import * as program from "commander";
import { DongleController as Dc, types as dcTypes } from "../chan-dongle-extended-client";
import * as storage from "node-persist";
import { InstallOptions } from "../lib/InstallOptions";
import * as path from "path";
import * as os from "os";
import "colors";

program
    .command("list")
    .description("List dongles")
    .action(async () => {

        let dc = await getDcInstance();

        try {

            console.log(JSON.stringify(dc.dongles.valuesAsArray(), null, 2));

            process.exit(0);

        } catch (error) {

            console.log(error.message.red);

            process.exit(1);

        }

    });

program
    .command("select [imei]")
    .description([
        "Select dongle for subsequent calls",
        " ( to avoid having to set --imei on each command)"
    ].join(""))
    .action(async (imei: string) => {

        if (!imei) {
            console.log("Error: command malformed".red);
            process.exit(-1);
        }

        let dc = await getDcInstance();

        if (!dc.dongles.has(imei)) {
            console.log("Error: no such dongle connected".red);
            process.exit(-1);
        }

        await selected_dongle.set(imei);

        console.log(`Dongle ${imei} selected`);

        process.exit(0);


    });

program
    .command("unlock")
    .description("provide SIM PIN or PUK to unlock dongle")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("-p, --pin [pin]", "SIM PIN ( 4 digits )")
    .option("--puk [puk-newPin]", "PUK ( 8 digits ) and new PIN eg. --puk 12345678-0000")
    .action(async options => {

        let imei = await selected_dongle.get(options);

        if (!options.pin && !options.puk) {
            console.log("Error: command malformed".red);
            console.log(options.optionHelp());
            process.exit(-1);
        }

        let dc = await getDcInstance();

        let unlockResult;

        try {

            if (options.pin) {
                unlockResult = await dc.unlock(imei, options.pin);
            } else {

                let match = (options.puk as string).match(/^([0-9]{8})-([0-9]{4})$/);

                if (!match) {
                    console.log("Error: puk-newPin malformed".red);
                    console.log(options.optionHelp());
                    process.exit(-1);
                    return;
                }

                let puk = match[1];
                let newPin = match[2];

                unlockResult = await dc.unlock(imei, puk, newPin);

            }

        } catch (error) {

            console.log(error.message.red);
            process.exit(1);
            return;

        }

        console.log(JSON.stringify(unlockResult, null, 2));

        process.exit(0);

    });

program
    .command("reboot")
    .description("Send AT command to reboot a dongle")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .action(async options => {

        const imei = await selected_dongle.get(options);

        const dc = await getDcInstance();

        try {

            await dc.rebootDongle(imei);

        } catch (error) {

            console.log(error.message.red);
            process.exit(1);
            return;

        }

        console.log("OK".green);

        process.exit(0);

    });


program
    .command("send")
    .description("Send SMS")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("-n, --number [number]", "target phone number")
    .option("-t, --text [text]", "Text of the message")
    .option("-T, --text-base64 [textBase64]", "Text Base64 encoded")
    .action(async options => {

        let { number, text, textBase64 } = options;

        if (!number || (!text && !textBase64)) {
            console.log("Error: command malformed".red);
            console.log(options.optionHelp());
            process.exit(-1);
        }

        let imei = await selected_dongle.get(options);

        let dc = await getDcInstance();

        if (textBase64) {

            const st = await import("transfer-tools/dist/lib/stringTransform");

            text = st.safeBufferFromTo(textBase64, "base64", "utf8");

        } else {

            text = JSON.parse(`"${text}"`);

        }

        try {

            let sendMessageResult = await dc.sendMessage(imei, number, text);

            if (sendMessageResult.success) {
                console.log(sendMessageResult.sendDate.getTime());
                process.exit(0);
            } else {
                console.log(0);
                process.exit(1);
            }

        } catch (error) {

            console.log(error.message.red);
            process.exit(1);
            return;
        }


    });

program
    .command("messages")
    .description("Get received SMS")
    .option("-f, --flush", "Whether or not erasing retrieved messages")
    .action(async options => {

        const flush = options.flush === true;

        let dc = await getDcInstance();

        try {

            const messages = await dc.getMessages({ flush });

            console.log(JSON.stringify(messages, null, 2));

            process.exit(0);

        } catch (error) {

            console.log(error.message.red);
            process.exit(1);
            return;

        }


    });

program
.command("new-contact")
.description("Store new contact in phonebook memory")
.option("-i, --imei [imei]", "IMEI of the dongle")
.option("--name [name]", "Contact's name")
.option("--number [number]", "Contact's number")
.action(async options => {

    let { name, number } = options;

    if (!name || !number) {
        console.log("Error: provide at least one of number or name".red);
        console.log(options.optionHelp());
        process.exit(-1);
    }

    const imei = await selected_dongle.get(options);

    const dc = await getDcInstance();

    const dongle = dc.usableDongles.get(imei);

    if( !dongle ){

        console.log("Error: selected dongle is disconnected or locked".red);
        process.exit(1);
        return;

    }

    let contact: dcTypes.Sim.Contact;

    try{

        contact= await dc.createContact(dongle.sim.imsi, number, name);

    } catch(error){

        console.log(error.message.red);
        process.exit(1);
        return;

    }

    console.log(JSON.stringify(contact, null, 2));

    process.exit(0);

});


program
.command("delete-contact")
.description("Delete a contact from phonebook memory")
.option("-i, --imei [imei]", "IMEI of the dongle")
.option("--index [index]", "Contact's index")
.action(async options => {

    const index = parseInt(options["index"]);

    if ( isNaN(index) ) {
        console.log("Error: command malformed".red);
        console.log(options.optionHelp());
        process.exit(-1);
    }

    const imei = await selected_dongle.get(options);

    const dc = await getDcInstance();

    const dongle = dc.usableDongles.get(imei);

    if( !dongle ){

        console.log("Error: selected dongle is disconnected or locked".red);
        process.exit(1);
        return;

    }

    try{

        await dc.deleteContact(dongle.sim.imsi, index);

    } catch(error){

        console.log(error.message.red);
        process.exit(1);
        return;

    }

    console.log(`Contact at index ${index} in SIM memory have been deleted successfully.`);

    process.exit(0);

});

async function getDcInstance(): Promise<Dc> {

    const { bind_addr, port }= InstallOptions.get();

    let dc = Dc.getInstance(bind_addr, port);

    try {

        await dc.prInitialization;

    } catch {

        console.log("dongle-extended is not running".red);
        process.exit(1);

    }

    return dc;

}

namespace selected_dongle {

    const get_storage_user_path = () => path.join("/var/tmp", `${os.userInfo().username}_selected_dongle`);

    export async function get(options: { imei: string | undefined }): Promise<string> {

        if (options.imei) {
            return options.imei;
        } else {

            await storage.init({ "dir": get_storage_user_path() });

            let imei = await storage.getItem("cli_imei");

            if (!imei) {
                console.log("Error: No dongle selected");
                process.exit(-1);
            }

            return imei;

        }

    }

    export async function set(imei: string) {

        await storage.init({ "dir": get_storage_user_path() });

        await storage.setItem("cli_imei", imei);

    }


}

if (require.main === module) {

    process.once("unhandledRejection", error => { throw error; });

    program.parse(process.argv);

}
