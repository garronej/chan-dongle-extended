#!/usr/bin/env node
require("rejection-tracker").main(__dirname, "..", "..");

import * as program from "commander";
import { AmiClient } from "chan-dongle-extended-client";
import { spawn } from "child_process";
import * as storage from "node-persist";
import * as path from "path";
import "colors";

const persistDir = path.join(__dirname, "..", "..", ".node-persist", "storage");

program
    .command("list")
    .description("List active dongle")
    .action(async options => {

        await assertServiceRunning();

        let client = AmiClient.localhost();

        let dongles = await client.getActiveDongles();

        console.log(JSON.stringify(dongles, null, 2));

        process.exit(0);

    });

program
    .command("list-locked")
    .description("List PIN/PUK locked dongles")
    .action(async options => {

        await assertServiceRunning();

        let client = AmiClient.localhost();

        let locked = await client.getLockedDongles();

        console.log(JSON.stringify(locked, null, 2));
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

        let client = AmiClient.localhost();

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

        await assertServiceRunning();

        let imei = await getImei(options);

        if (!options.pin && !options.puk) {
            console.log("Error: command malformed".red);
            console.log(options.optionHelp());
            process.exit(-1);
        }

        let client = AmiClient.localhost();
        let error: null | Error;

        if (options.pin)
            error = await client.unlockDongle(imei, options.pin);
        else {

            let match = (options.puk as string).match(/^([0-9]{8})-([0-9]{4})$/);

            if (!match) {
                console.log("Error: puk-newPin malformed".red);
                console.log(options.optionHelp());
                return process.exit(-1);
            }

            let puk = match[1];
            let newPin = match[2];

            error = await client.unlockDongle(imei, puk, newPin);

        }

        if (error) {
            console.log(error.message.red);
            process.exit(-1);
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
    .action(async options => {

        await assertServiceRunning();

        let { number, text } = options;

        if (!number || !text) {
            console.log("Error: command malformed".red);
            console.log(options.optionHelp());
            process.exit(-1);
        }

        let imei = await getImei(options);

        text = JSON.parse(`"${text}"`);

        let [error, messageId] = await AmiClient
            .localhost()
            .sendMessage(imei, number, text);

        if (error) {
            console.log(error.message.red);
            process.exit(-1);
        }

        console.log(messageId);

        process.exit(0);

    });


program
    .command("phonebook")
    .description("Get SIM card phonebook")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .action(async options => {

        await assertServiceRunning();

        let imei = await getImei(options);

        let [error, phonebook] = await AmiClient
            .localhost()
            .getSimPhonebook(imei);

        if (error) {
            console.log(error.message.red);
            process.exit(-1);
            return;
        }

        console.log(JSON.stringify(phonebook!, null, 2));

        process.exit(0);

    });

program
    .command("new-contact")
    .description("Store new contact in phonebook memory")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("--name [name]", "Contact's name")
    .option("--number [number]", "Contact's number")
    .action(async options => {

        await assertServiceRunning();

        let { name, number } = options;

        if (!name || !number) {
            console.log("Error: command malformed".red);
            console.log(options.optionHelp());
            process.exit(-1);
        }

        let imei = await getImei(options);

        let [error, contact] = await AmiClient
            .localhost()
            .createContact(imei, name, number);

        if (error) {
            console.log(error.message.red);
            process.exit(-1);
            return;
        }

        console.log(JSON.stringify(contact!, null, 2));

        process.exit(0);

    });

program
    .command("update-number")
    .description("Re write subscriber phone number on SIM card")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("--number [number]", "SIM card phone number")
    .action(async options => {

        await assertServiceRunning();

        let { number } = options;

        if (!number) {
            console.log("Error: command malformed".red);
            console.log(options.optionHelp());
            process.exit(-1);
        }

        let imei = await getImei(options);

        let error = await AmiClient
            .localhost()
            .updateNumber(imei, number);

        if (error) {
            console.log(error.message.red);
            process.exit(-1);
            return;
        }

        console.log("done");

        process.exit(0);

    });


program
    .command("delete-contact")
    .description("Delete a contact from phonebook memory")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("--index [index]", "Contact's index")
    .action(async options => {

        await assertServiceRunning();

        let { index } = options;

        if (!index) {
            console.log("Error: command malformed".red);
            console.log(options.optionHelp());
            process.exit(-1);
        }

        let imei = await getImei(options);

        let error = await AmiClient
            .localhost()
            .deleteContact(imei, parseInt(index));

        if (error) {
            console.log(error.message.red);
            process.exit(-1);
            return;
        }

        console.log(`Contact index: ${index} successfully deleted`);

        process.exit(0);

    });

program
    .command("messages")
    .description("Get received SMS")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("-f, --flush", "Whether or not erasing retrieved messages")
    .action(async options => {

        await assertServiceRunning();

        let flush: boolean = (options.flush === true);

        let imei = await getImei(options);

        let [error, messages] = await AmiClient
            .localhost()
            .getMessages(imei, flush);

        if (error) {
            console.log(error.message.red);
            process.exit(-1);
            return;
        }

        console.log(JSON.stringify(messages!, null, 2));

        process.exit(0);


    });

program.parse(process.argv);

function assertServiceRunning(): Promise<void> {

    return new Promise<void>(resolve => resolve());

    /*
    return new Promise<void>(resolve => {
        spawn("systemctl", ["status", "dongle-extended.service"])
            .stdout
            .once("data", data => {

                let line = data.toString("utf8").split("\n")[2];

                if (!line || !line.match(/^\ *Active:\ *active/)) {
                    console.log("Error: dongle-extended service is not running!".red);
                    console.log("run: sudo systemctl start dongle-extended");
                    process.exit(-1);
                }

                resolve();
            });
    });
    */

}

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