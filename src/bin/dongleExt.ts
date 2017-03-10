#!/usr/bin/env node

import { AmiClient } from "../lib/index";
import { spawn } from "child_process";
require("colors");

function isServiceRunning(): Promise<boolean> {

    return new Promise<boolean>(resolve => {
        spawn("systemctl", ["status", "dongleExt.service"])
            .stdout
            .once("data",
            data => {

                let line= data.toString("utf8").split("\n")[2];

                resolve( line && line.match(/^\ *Active:\ *active/) );
            }
            );
    });

}


(async ()=> {


    if( !await isServiceRunning() ){
        console.log("Service not running");
        process.exit(1);
    }

    console.log("poccess running");




})();


/*
console.log("Hello world");

console.log(process.argv);

process.exit(0);


let command= process.argv[1];


let amiClient= AmiClient.getLocal();

switch( command ){
    case "GetActiveDongles": 
        amiClient.getActiveDongles( dongles => {
            console.log(JSON.stringify(dongles, null, 2));
            process.exit(0);
        });
    break;
}
*/





