import { execQueue, ExecQueue } from "ts-exec-queue";
import { 
    DongleExtendedClient, 
    textSplitBase64ForAmiEncodeFirst 
} from "chan-dongle-extended-client";

import { Message, StatusReport } from "ts-gsm-modem";

import { ChanDongleConfManager } from "./ChanDongleConfManager";
const dialplanContext = ChanDongleConfManager.getConfig().defaults.context;

const smsExtension = "reassembled-sms";
const smsStatusReportExtension = "sms-status-report";


export namespace Dialplan {

    export interface DongleIdentifier {
        name: string;
        imei: string;
        imsi: string;
        number: string;
        provider: string;
    }

    const cluster = {};

    export const notifyStatusReport = execQueue(cluster, "STATUS_REPORT",
        async (dongle: DongleIdentifier, statusReport: StatusReport, callback?: () => void) => {

            let { name, number, provider, imei, imsi } = dongle;

            let assignations = [
                `CALLERID(name)=${name}`,
                `DONGLENAME=${name}`,
                `DONGLEPROVIDER=${provider}`,
                `DONGLEIMEI=${imei}`,
                `DONGLEIMSI=${imsi}`,
                `DONGLENUMBER=${number}`
            ];

            let { dischargeTime, isDelivered, messageId, status, recipient } = statusReport;

            assignations = [
                ...assignations,
                `STATUS_REPORT_DISCHARGE_TIME=${dischargeTime.toISOString()}`,
                `STATUS_REPORT_IS_DELIVERED=${isDelivered}`,
                `STATUS_REPORT_ID=${messageId}`,
                `STATUS_REPORT_STATUS=${status}`,
                `STATUS_REPORT_RECIPIENT=${recipient}`
            ];

            await assignAndOriginate(assignations, smsStatusReportExtension);

            callback!();

        }
    );

    export const notifySms = execQueue(cluster, "NOTIFY_SMS",
        async (dongle: DongleIdentifier, message: Message, callback?: () => void) => {

            let { name, number, provider, imei, imsi } = dongle;

            let assignations = [
                `CALLERID(name)=${name}`,
                `DONGLENAME=${name}`,
                `DONGLEPROVIDER=${provider}`,
                `DONGLEIMEI=${imei}`,
                `DONGLEIMSI=${imsi}`,
                `DONGLENUMBER=${number}`
            ];

            assignations = [
                ...assignations,
                `CALLERID(num)=${message.number}`,
                `CALLERID(ani)=${message.number}`,
                `SMS_NUMBER=${message.number}`,
                `SMS_DATE=${message.date.toISOString()}`
            ];

            let { text } = message;

            let keywordSplit = "SMS_BASE64_PART_";

            let textSplit = textSplitBase64ForAmiEncodeFirst(
                text,
                "ApplicationData" + `${keywordSplit}000=Set()`
            );

            assignations.push(`SMS_TEXT_SPLIT_COUNT=${textSplit.length}`);

            for (let i = 0; i < textSplit.length; i++)
                assignations.push(`${keywordSplit}${i}=${textSplit[i]}`);

            let keywordTruncated = "SMS_BASE64";
            let actionConcatenate = keywordTruncated + "=${" + keywordTruncated + "}";

            let truncatedText = text.substring(0, 1000);

            if (truncatedText.length < text.length)
                truncatedText += " [ truncated ]";

            let textTruncatedSplit = textSplitBase64ForAmiEncodeFirst(
                truncatedText,
                "ApplicationData" + `${actionConcatenate}=Set()`
            );

            assignations.push(`${keywordTruncated}=${textTruncatedSplit.shift()}`);

            for (let part of textTruncatedSplit)
                assignations.push(`${actionConcatenate}${part}`);

            assignations.push(`SMS=${JSON.stringify(text.substring(0, 200))}`);

            await assignAndOriginate(assignations, smsExtension);

            callback!();

        }
    );

}

async function assignAndOriginate(assignations: string[], gotoExtension: string) {

    const ami = DongleExtendedClient.localhost().ami;

    let priority = 1;

    let initExtension = `init-${gotoExtension}`;

    await ami.addDialplanExtension(initExtension, priority++, dialplanContext, "Answer");

    for (let assignation of assignations)
        await ami.addDialplanExtension(initExtension, priority++, dialplanContext, "Set", assignation);

    await ami.addDialplanExtension(initExtension, priority++, dialplanContext, "GoTo", `${gotoExtension},1`);

    await ami.originateLocalChannel(dialplanContext, initExtension);

}