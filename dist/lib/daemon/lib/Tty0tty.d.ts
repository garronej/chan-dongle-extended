export declare class Tty0tty {
    readonly leftEnd: string;
    readonly rightEnd: string;
    private static store;
    static getPair(): Tty0tty;
    release(): void;
    private available;
    private constructor(leftEnd, rightEnd);
}
