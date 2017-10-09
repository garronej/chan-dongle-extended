const numberOfPairs= 24;

export class Tty0tty {

    private static store = (() => {

        let out: Tty0tty[] = [];

        let index = 0;

        for (let _ of new Array(numberOfPairs)) {

            out.push(new Tty0tty(`/dev/tnt${index++}`, `/dev/tnt${index++}`));

        }

        return out;

    })();

    public static getPair(): Tty0tty {

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
        public readonly leftEnd: string,
        public readonly rightEnd: string
    ) { }
}
