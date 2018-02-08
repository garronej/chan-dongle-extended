import { Modem } from "ts-gsm-modem";
import { AccessPoint } from "gsm-modem-connection";
import { Modems } from "./defs";
export declare function start(modems: Modems): void;
export declare function bridge(accessPoint: AccessPoint, modem: Modem): Promise<void>;
