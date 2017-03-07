export class Tty0tty {

    private static store= (()=>{

        let out: Tty0tty[]= [];

        for (let i = 0; i <= 6; i += 2)
            out.push(new Tty0tty(`/dev/tnt${i}`, `/dev/tnt${i + 1}`));

        return out;

    })();

    public static get(): Tty0tty {

        for (let pair of this.store)
            if (pair.available) {
                pair.available = false;
                return pair;
            }
            
        throw new Error("No more void modem available");

    }

    public release(): void {
        this.available = true;
    }

    private available = true;

    private constructor(
        public readonly local: string,
        public readonly extern: string
    ) {}
}
