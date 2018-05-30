import { apiDeclaration } from "../chan-dongle-extended-client";
import { Message } from "ts-gsm-modem";
import * as sqliteCustom from "sqlite-custom";
export declare let _: sqliteCustom.Api;
/** Must be called and awaited before use */
export declare function launch(): Promise<void>;
/** Debug only */
export declare function flush(): Promise<void>;
export declare namespace pin {
    type AssociatedTo = AssociatedTo.Iccid | AssociatedTo.Imei;
    namespace AssociatedTo {
        type Iccid = {
            iccid: string;
        };
        namespace Iccid {
            function match(associatedTo: AssociatedTo): associatedTo is Iccid;
        }
        type Imei = {
            imei: string;
        };
        namespace Imei {
            function match(associatedTo: AssociatedTo): associatedTo is Imei;
        }
    }
    function save(pin: string | undefined, associatedTo: AssociatedTo): Promise<any>;
    function get(associatedTo: AssociatedTo): Promise<string | undefined>;
}
export declare namespace messages {
    function retrieve(params: apiDeclaration.service.getMessages.Params): Promise<apiDeclaration.service.getMessages.Response>;
    function save(imsi: string, message: Message): Promise<void>;
}
