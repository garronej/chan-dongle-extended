import { Message, StatusReport } from "ts-gsm-modem";
export interface DongleIdentifier {
    name: string;
    imei: string;
    imsi: string;
    number: string;
    provider: string;
}
export declare function notifyStatusReport(dongle: DongleIdentifier, statusReport: StatusReport): Promise<void>;
export declare function notifySms(dongle: DongleIdentifier, message: Message): Promise<void>;
