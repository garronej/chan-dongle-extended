
import { AmiClient, strDivide } from "chan-dongle-extended-client";

import { Message, StatusReport } from "ts-gsm-modem";

import { ChanDongleConfManager } from "./ChanDongleConfManager";
const dialplanContext = ChanDongleConfManager.getConfig().defaults.context as string;

const smsExtension = "reassembled-sms";

const smsStatusReportExtension= "sms-status-report";

export namespace Dialplan {

    export let amiClient: AmiClient = null as any;

    export interface DongleIdentifier {
        name: string;
        imei: string;
        imsi: string;
        number: string;
        provider: string;
    }

    export async function notifyStatusReport(
        dongle: DongleIdentifier,
        statusReport: StatusReport
    ){

        let { name, number, provider, imei, imsi}= dongle;

        let assignations = [
            `CALLERID(name)=${name}`,
            `DONGLENAME=${name}`,
            `DONGLEPROVIDER=${provider}`,
            `DONGLEIMEI=${imei}`,
            `DONGLEIMSI=${imsi}`,
            `DONGLENUMBER=${number}`
        ];

        let { 
            dischargeTime,
            isDelivered,
            messageId,
            status
        } = statusReport;

        assignations= [ 
            ...assignations, 
            `STATUS_REPORT_DISCHARGE_TIME=${dischargeTime.toUTCString()}`,
            `STATUS_REPORT_IS_DELIVERED=${isDelivered}`,
            `STATUS_REPORT_ID=${messageId}`,
            `STATUS_REPORT_STATUS=${status}`
        ];

        await assignAndRun(assignations, smsStatusReportExtension);

    }

    export async function notifySms(
        dongle: DongleIdentifier,
        message: Message
    ) {

        let { name, number, provider, imei, imsi}= dongle;

        let assignations = [
            `CALLERID(name)=${name}`,
            `DONGLENAME=${name}`,
            `DONGLEPROVIDER=${provider}`,
            `DONGLEIMEI=${imei}`,
            `DONGLEIMSI=${imsi}`,
            `DONGLENUMBER=${number}`
        ];

        assignations= [ 
            ...assignations, 
            `CALLERID(num)=${message.number}`,
            `CALLERID(ani)=${message.number}`,
            `SMS_NUMBER=${message.number}`,
            `SMS_DATE=${message.date.toUTCString()}`
        ];

        let { text }= message;

        let textSplit = strDivide(200, encodeURI(text));

        assignations.push(`SMS_TEXT_SPLIT_COUNT=${textSplit.length}`);

        for (let i = 0; i < textSplit.length; i++)
            assignations.push(`SMS_TEXT_P${i}=${textSplit[i]}`);

        let truncatedText = text.substring(0, 2048);

        if (truncatedText.length < text.length)
            truncatedText += " [ truncated ]";

        let textTruncatedSplit = strDivide(200, encodeURI(truncatedText));

        assignations.push(`SMS_URI_ENCODED=${textTruncatedSplit.shift()}`);

        for (let part of textTruncatedSplit)
            assignations.push(`SMS_URI_ENCODED=\${SMS_URI_ENCODED}${part}`);

        assignations.push(`SMS=${JSON.stringify(text.substring(0, 200))}`);

        await assignAndRun(assignations, smsExtension);

    }

    async function addDialplanExtension(
        extension: string,
        priority: number,
        application: string,
        context: string,
        replace?: boolean
    ) {

        let rawCommand = [
            `dialplan add extension ${extension},${priority},${application}`,
            ` into ${context}${(replace !== false) ? " replace" : ""}`
        ].join("");

        await amiClient.postAction({
            "action": "Command",
            "Command": rawCommand
        });

    }

    async function assignAndRun(assignations: string[], gotoExtension: string){

        let priority = 1;

        let initExtension= `init-${gotoExtension}`;

        await addDialplanExtension(initExtension, priority++, "Answer()", dialplanContext);

        for (let assignation of assignations)
            await addDialplanExtension(initExtension, priority++, `Set(${assignation})`, dialplanContext);

        await addDialplanExtension(initExtension, priority++, `GoTo(${gotoExtension},1)`, dialplanContext);

        await amiClient.postAction({
            "action": "originate",
            "channel": `Local/${initExtension}@${dialplanContext}`,
            "application": "Wait",
            "data": "60"
        });


    }



}

