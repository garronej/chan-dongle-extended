import { Ami } from "ts-ami";
import * as tt from "transfer-tools";
import * as types from "./types";
import * as logger from "logger";

const debug= logger.debugFactory();

export function init(
    modems: types.Modems,
    ami: Ami,
    dialplanContext: string,
    defaultNumber: string
) {

    modems.evtCreate.attach(([modem, accessPoint]) => {

        if (!types.matchModem(modem)) {
            return;
        }


        const dongleVariables = {
            "DONGLENAME": accessPoint.friendlyId,
            "DONGLEPROVIDER": `${modem.serviceProviderName}`,
            "DONGLEIMEI": modem.imei,
            "DONGLEIMSI": modem.imsi,
            "DONGLENUMBER": modem.number || defaultNumber
        };

        modem.evtMessage.attach(message => {

            debug("Notify Message");

            let textSplit = tt.stringTransform.textSplit(
                Ami.headerValueMaxLength,
                tt.stringTransform.safeBufferFromTo(message.text, "utf8", "base64")
            );

            let variables = {
                ...dongleVariables,
                "SMS_NUMBER": message.number,
                "SMS_DATE": message.date.toISOString(),
                "SMS_TEXT_SPLIT_COUNT": `${textSplit.length}`,
                "SMS_BASE64": tt.stringTransformExt.b64crop(Ami.headerValueMaxLength, message.text)
            };

            for (let i = 0; i < textSplit.length; i++){
                variables[`SMS_BASE64_PART_${i}`] = textSplit[i];
            }

            ami.originateLocalChannel(dialplanContext, "reassembled-sms", variables);

        });

        modem.evtMessageStatusReport.attach(statusReport => {

            debug("Notify status report");

            let { dischargeDate, isDelivered, sendDate, status, recipient } = statusReport;

            let variable = {
                ...dongleVariables,
                "STATUS_REPORT_DISCHARGE_TIME": isNaN(dischargeDate.getTime()) ? `${dischargeDate}` : dischargeDate.toISOString(),
                "STATUS_REPORT_IS_DELIVERED": `${isDelivered}`,
                "STATUS_REPORT_SEND_TIME": `${sendDate.getTime()}`,
                "STATUS_REPORT_STATUS": status,
                "STATUS_REPORT_RECIPIENT": recipient
            };

            ami.originateLocalChannel(dialplanContext, "sms-status-report", variable);

        });

    });

}

