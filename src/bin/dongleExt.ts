#!/usr/bin/env node

import * as program from "commander";
import { AmiClient } from "../lib/index";
import { spawn } from "child_process";
import * as pr from "ts-promisify";
import * as storage from "node-persist";
require("colors");

function assertServiceRunning(): Promise<void> {

    return new Promise<void>(resolve => {
        spawn("systemctl", ["status", "dongleExt.service"])
            .stdout
            .once("data",
            data => {

                let line = data.toString("utf8").split("\n")[2];

                if( !line || !line.match(/^\ *Active:\ *active/) ){
                    console.log("Error: dongleExt service is not running!".red);
                    console.log("run: sudo systemctl start dongleExt");
                    process.exit(-1);
                }

                resolve();
            }
            );
    });

}

program
    .version('0.0.1')

program
    .command("active")
    .alias("a")
    .description("List PIN locked dongle's IMEI")
    .option("-j, --json", "Format result in json")
    .action(async options => {

            await assertServiceRunning();

            let client = AmiClient.getLocal();

            let [ dongles ] = await pr.typed(client, client.getActiveDongles)();

            if (!options.json)
                for (let imei of dongles)
                    console.log(imei);
            else
                console.log(JSON.stringify(dongles, null, 2));

            process.exit(0);

    });
    
      //.command("select", "Select a dongle for the subsequent calls")

program
.command("select [imei]")
.alias("s")
.description([
    "Select dongle for subsequent calls",
" ( to avoid having to set --imei on each command)"
].join(""))
.action(async (imei:string) => {

        if( !imei ){
            console.log("Error: command malformed".red);
            process.exit(-1);
        }

        let client = AmiClient.getLocal();


        let [ active ]= await pr.typed(client, client.getActiveDongles)();

        let [ locked ]= await pr.typed(client, client.getLockedDongles)();

        let dongles= [ ...active, ...Object.keys(locked) ];

        if( dongles.indexOf(imei) < 0 ){
            console.log("Error: no such dongle connected".red);
            process.exit(-1);
        }

        await storage.init();

        await storage.setItem("imei", imei);

        console.log(`Dongle ${imei} selected`.green);

        process.exit(0);


});

program
    .command("send")
    .alias("s")
    .description("Send SMS")
    .option("-i, --imei [imei]", "IMEI of the dongle")
    .option("-n, --number [number]", "target phone number")
    .option("-t, --text [text]", "Text of the message")
    .action(async options => {

        await assertServiceRunning();

        let { imei, number, text } = options;

        if (!number || !text) {
            console.log("Error: command malformed".red);
            console.log(options.optionHelp());
            process.exit(-1);
        }

        if( !imei ){

            await storage.init();

            imei= await storage.getItem("imei");

        }

        if( !imei ){
            console.log("Error: No dongle selected");
            process.exit(-1);
        }

        text = JSON.parse('"' + text + '"');

        let client = AmiClient.getLocal();

        let [error, messageId] = await client.sendMessage(imei, number, text);

        if (error) {
            console.log(error.message.red);
            process.exit(-1);
        }

        console.log(messageId);

        process.exit(0);

    });


program.parse(process.argv);





    /*
    program
      .version('0.0.1')
      .command("locked", "List PIN locked dongle's IMEI").alias("l")
      .command("active", "List active dongle's IMEI").alias("a")
      .command("select", "Select a dongle for the subsequent calls")
      .command("unlock", "Provide pin or puk to unlock dongle")
      .command("send", "Send SMS message").alias("s")
      .command("contacts", "Retrieve contact stored in a SIM card phonebook memory").alias("c")
      .command("create-contact", "Add a new contact in the phonebook memory")
      .command("delete-contact", "Add a new contact in the phonebook memory")
      .parse(process.argv);
    */