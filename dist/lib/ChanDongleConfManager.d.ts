import { ExecQueue } from "ts-exec-queue";
export interface DongleConf {
    id: string;
    dataIfPath: string;
    audioIfPath: string;
}
export declare namespace ChanDongleConfManager {
    const addDongle: (({id, dataIfPath, audioIfPath}: DongleConf, callback?: (() => void) | undefined) => Promise<void>) & ExecQueue;
    const removeDongle: ((dongleId: string, callback?: (() => void) | undefined) => Promise<void>) & ExecQueue;
}