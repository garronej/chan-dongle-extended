import * as iniSource from "ini";
export declare let ini: {
    parseStripWhitespace: (initstring: string) => any;
    decode(inistring: string): any;
    parse(initstring: string): any;
    encode(object: any, options?: iniSource.EncodeOptions | undefined): string;
    stringify(object: any, options?: iniSource.EncodeOptions | undefined): string;
    safe(val: string): string;
    unsafe(val: string): string;
};
