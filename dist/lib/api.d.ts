import * as types from "./types";
import { types as dcTypes } from "../chan-dongle-extended-client";
export declare function beforeExit(): Promise<void>;
export declare namespace beforeExit {
    let impl: () => Promise<void>;
}
export declare function launch(modems: types.Modems, staticModuleConfiguration: dcTypes.StaticModuleConfiguration): Promise<void>;
