#!/usr/bin/env node
require("rejection-tracker").main(__dirname, "..", "..");

import * as program from "commander";
import { DongleExtendedClient } from "chan-dongle-extended-client";
import * as storage from "node-persist";
import * as path from "path";
import { Base64 } from "js-base64";
import "colors";

const persistDir = path.join(__dirname, "..", "..", ".node-persist", "storage");

program
    .command("list")
    .description("List active dongle")
    .action(async options => {

        let dongles = await DongleExtendedClient.localhost().getActiveDongles();

        console.log(JSON.stringify(dongles, null, 2));

        process.exit(0);

    });

program
    .command("list-locked")
    .description("List PIN/PUK locked dongles")
    .action(async options => {

        let dongles = await DongleExtendedClient.localhost().getLockedDongles();

        console.log(JSON.stringify(dongles, null, 2));

        process.exit(0);


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

        let client = DongleExtendedClient.localhost();

        let arrImei: string[] = [];

        for (let { imei } of await client.getActiveDongles())
            arrImei.push(imei);

        for (let { imei } of await client.getLockedDongles())
            arrImei.push(imei);

        if (arrImei.indexOf(imei) < 0) {
            console.log("Error: no such dongle connected".red);
            process.exit(-1);
        }

        await storage.init({ "dir": persistDir });

        await storage.setItem("cli_imei", imei);

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

        let imei = await getImei(options);

        if (!options.pin && !options.puk) {
            console.log("Error: command malformed".red);
            console.log(options.optionHelp());
            process.exit(-1);
        }

        let client = DongleExtendedClient.localhost();

        if (options.pin)
            await client.unlockDongle(imei, options.pin);
        else {

            let match = (options.puk as string).match(/^([0-9]{8})-([0-9]{4})$/);

            if (!match) {
                console.log("Error: puk-newPin malformed".red);
                console.log(options.optionHelp());
                return process.exit(-1);
            }

            let puk = match[1];
            let newPin = match[2];

            await client.unlockDongle(imei, puk, newPin);

        }


        console.log("done");

        process.exit(0);

    });


program
    .command("send")
    .description("Send SMS")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("-n, --number [number]", "target phone number")
    .option("-t, --text [text]", "Text of the message")
    .option("-t64, --text-base64 [textBase64]", "Text Base64 encoded")
    .action(async options => {

        let { number, text, textBase64 } = options;

        if (!number || (!text && !textBase64)) {
            console.log("Error: command malformed".red);
            console.log(options.optionHelp());
            process.exit(-1);
        }

        let imei = await getImei(options);

        text = textBase64 ? Base64.decode(textBase64) : JSON.parse(`"${text}"`);

        let messageId = await DongleExtendedClient
            .localhost()
            .sendMessage(imei, number, text);

        console.log(messageId);

        process.exit(0);

    });


program
    .command("phonebook")
    .description("Get SIM card phonebook")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .action(async options => {

        let imei = await getImei(options);

        let phonebook = await DongleExtendedClient
            .localhost()
            .getSimPhonebook(imei);

        console.log(JSON.stringify(phonebook, null, 2));

        process.exit(0);

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
            console.log("Error: command malformed".red);
            console.log(options.optionHelp());
            process.exit(-1);
        }

        let imei = await getImei(options);

        let contact = await DongleExtendedClient
            .localhost()
            .createContact(imei, name, number);

        console.log(JSON.stringify(contact, null, 2));

        process.exit(0);

    });

program
    .command("update-number")
    .description("Re write subscriber phone number on SIM card")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("--number [number]", "SIM card phone number")
    .action(async options => {

        let { number } = options;

        if (!number) {
            console.log("Error: command malformed".red);
            console.log(options.optionHelp());
            process.exit(-1);
        }

        let imei = await getImei(options);

        await DongleExtendedClient
            .localhost()
            .updateNumber(imei, number);

        console.log("done");

        process.exit(0);

    });


program
    .command("delete-contact")
    .description("Delete a contact from phonebook memory")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("--index [index]", "Contact's index")
    .action(async options => {

        let { index } = options;

        if (!index) {
            console.log("Error: command malformed".red);
            console.log(options.optionHelp());
            process.exit(-1);
        }

        let imei = await getImei(options);

        await DongleExtendedClient
            .localhost()
            .deleteContact(imei, parseInt(index));

        console.log(`Contact index: ${index} successfully deleted`);

        process.exit(0);

    });

program
    .command("messages")
    .description("Get received SMS")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("-f, --flush", "Whether or not erasing retrieved messages")
    .action(async options => {

        let flush: boolean = (options.flush === true);

        let imei = await getImei(options);

        let messages = await DongleExtendedClient
            .localhost()
            .getMessages(imei, flush);

        console.log(JSON.stringify(messages, null, 2));

        process.exit(0);


    });

program.parse(process.argv);

async function getImei(options: { imei: string | undefined }): Promise<string> {

    if (options.imei) return options.imei;

    await storage.init({ "dir": persistDir });

    let imei = await storage.getItem("cli_imei");

    if (!imei) {
        console.log("Error: No dongle selected");
        process.exit(-1);
    }

    return imei;

}