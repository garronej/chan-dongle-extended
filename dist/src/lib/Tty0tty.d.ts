export declare class Tty0tty {
    readonly leftEnd: string;
    readonly rightEnd: string;
    static makeFactory(): (() => Tty0tty);
    private available;
    private constructor();
    release(): void;
}
