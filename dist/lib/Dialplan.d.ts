import { ExecQueue } from "ts-exec-queue";
import { Message, StatusReport } from "ts-gsm-modem";
export declare namespace Dialplan {
    interface DongleIdentifier {
        name: string;
        imei: string;
        imsi: string;
        number: string;
        provider: string;
    }
    const notifyStatusReport: ((dongle: DongleIdentifier, statusReport: StatusReport, callback?: (() => void) | undefined) => Promise<void>) & ExecQueue;
    const notifySms: ((dongle: DongleIdentifier, message: Message, callback?: (() => void) | undefined) => Promise<void>) & ExecQueue;
}
