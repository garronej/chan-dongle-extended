import { AmiClient } from "chan-dongle-extended-client";
import { Message, StatusReport } from "ts-gsm-modem";
export declare namespace Dialplan {
    let amiClient: AmiClient;
    interface DongleIdentifier {
        name: string;
        imei: string;
        imsi: string;
        number: string;
        provider: string;
    }
    function notifyStatusReport(dongle: DongleIdentifier, statusReport: StatusReport): Promise<void>;
    function notifySms(dongle: DongleIdentifier, message: Message): Promise<void>;
}
