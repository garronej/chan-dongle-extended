import { Modems } from "./defs";

import { Ami } from "../chan-dongle-extended-client";

import * as lt from "./defs";
import matchModem = lt.matchModem;

import { chanDongleConfManager } from "./chanDongleConfManager";

import * as _debug from "debug";
let debug = _debug("_dialplan");

export function start(modems: Modems, ami: Ami) {

    let configDefault= chanDongleConfManager.getConfig().defaults;

    const dialplanContext = configDefault.context;
    const defaultNumber= configDefault.exten;

    modems.evtCreate.attach(([modem, accessPoint]) => {

        if (!matchModem(modem)) return;

        const dongleVariables = {
            "DONGLENAME": accessPoint.friendlyId,
            "DONGLEPROVIDER": `${modem.serviceProviderName}`,
            "DONGLEIMEI": modem.imei,
            "DONGLEIMSI": modem.imsi,
            "DONGLENUMBER": modem.number || defaultNumber
        };

        modem.evtMessage.attach(message => {

            debug("Notify Message");

            let textSplit = Ami.b64.split(message.text);

            let variables = {
                ...dongleVariables,
                "SMS_NUMBER": message.number,
                "SMS_DATE": message.date.toISOString(),
                "SMS_TEXT_SPLIT_COUNT": `${textSplit.length}`,
                "SMS_BASE64": Ami.b64.crop(message.text)
            };

            for (let i = 0; i < textSplit.length; i++)
                variables[`SMS_BASE64_PART_${i}`] = textSplit[i];

            ami.originateLocalChannel(dialplanContext, "reassembled-sms", variables);

        });

        modem.evtMessageStatusReport.attach(statusReport => {

            debug("Notify status report");

            let { dischargeTime, isDelivered, messageId, status, recipient } = statusReport;

            let variable = {
                ...dongleVariables,
                "STATUS_REPORT_DISCHARGE_TIME": isNaN(dischargeTime.getTime()) ? `${dischargeTime}` : dischargeTime.toISOString(),
                "STATUS_REPORT_IS_DELIVERED": `${isDelivered}`,
                "STATUS_REPORT_ID": `${messageId}`,
                "STATUS_REPORT_STATUS": status,
                "STATUS_REPORT_RECIPIENT": recipient
            };

            ami.originateLocalChannel(dialplanContext, "sms-status-report", variable);

        });

    });

}

