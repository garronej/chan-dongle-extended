import { ExecQueue } from "ts-exec-queue";
import { Message, StatusReport } from "ts-gsm-modem";
export interface DongleIdentifier {
    name: string;
    imei: string;
    imsi: string;
    number: string;
    provider: string;
}
export declare namespace dialplan {
    const notifyStatusReport: ((dongle: DongleIdentifier, statusReport: StatusReport, callback?: (() => void) | undefined) => Promise<void>) & ExecQueue;
    const notifySms: ((dongle: DongleIdentifier, message: Message, callback?: (() => void) | undefined) => Promise<void>) & ExecQueue;
}
