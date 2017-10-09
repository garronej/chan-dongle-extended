import { AccessPoint } from "gsm-modem-connection";
import { Modem } from "ts-gsm-modem";
import { Modems } from "./defs";
export declare function start(modems: Modems): void;
export declare function bridge(accessPoint: AccessPoint, modem: Modem): Promise<void>;
