import { execQueue, ExecQueue } from "ts-exec-queue";
import {
    DongleExtendedClient,
    textSplitBase64ForAmiSplitFirst
} from "chan-dongle-extended-client";

import { Message, StatusReport } from "ts-gsm-modem";

import { chanDongleConfManager } from "./chanDongleConfManager";
const dialplanContext = chanDongleConfManager.getConfig().defaults.context;


import * as _debug from "debug";
let debug = _debug("_dialplan");


export interface DongleIdentifier {
    name: string;
    imei: string;
    imsi: string;
    number: string;
    provider: string;
}

export async function notifyStatusReport(dongle: DongleIdentifier, statusReport: StatusReport) {

    let ami = DongleExtendedClient.localhost().ami;

    let { name, number, provider, imei, imsi } = dongle;
    let { dischargeTime, isDelivered, messageId, status, recipient } = statusReport;

    let variable = {
        "DONGLENAME": name,
        "DONGLEPROVIDER": provider,
        "DONGLEIMEI": imei,
        "DONGLEIMSI": imsi,
        "DONGLENUMBER": number,
        "STATUS_REPORT_DISCHARGE_TIME": dischargeTime.toISOString(),
        "STATUS_REPORT_IS_DELIVERED": `${isDelivered}`,
        "STATUS_REPORT_ID": `${messageId}`,
        "STATUS_REPORT_STATUS": status,
        "STATUS_REPORT_RECIPIENT": recipient
    };

    await ami.originateLocalChannel(dialplanContext, "sms-status-report", variable);

}

export async function notifySms(dongle: DongleIdentifier, message: Message) {

    debug("start notify sms");

    let ami = DongleExtendedClient.localhost().ami;

    let { name, number, provider, imei, imsi } = dongle;

    let keywordSplit = "SMS_BASE64_PART_";

    let textSplit = textSplitBase64ForAmiSplitFirst(
        message.text,
        "Variable" + `${keywordSplit}XX=`
    );

    let variable: Record<string, string> = {
        "DONGLENAME": name,
        "DONGLEPROVIDER": provider,
        "DONGLEIMEI": imei,
        "DONGLEIMSI": imsi,
        "DONGLENUMBER": number,
        "SMS_NUMBER": message.number,
        "SMS_DATE": message.date.toISOString(),
        "SMS_TEXT_SPLIT_COUNT": `${textSplit.length}`,
        "SMS_BASE64": textSplit[0]
    };

    for (let i = 0; i < textSplit.length; i++)
        variable[`${keywordSplit}${i}`] = textSplit[i];

    ami.originateLocalChannel(dialplanContext, "reassembled-sms", variable);


}


