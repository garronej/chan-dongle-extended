import "colors";
export declare function run(command: string): Promise<string>;
export declare function ask(question: any): Promise<string>;
export declare function writeFileAssertSuccess(filename: string, data: string): Promise<void>;
