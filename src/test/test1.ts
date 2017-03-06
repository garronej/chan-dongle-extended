
import * as log from "why-is-node-running";
import { initClient } from "../lib/client";


let client = initClient();

client.sendMessage(
    "353762037478870",
    "0636786385",
    "Message sent",
    (error, messageId) => {

        if( error )
            console.log(error);
        else console.log("MessageId: ", messageId);

        client.disconnect();

    }
);
