export class VoidModem {

    private static store= (()=>{

        let out: VoidModem[]= [];

        for (let i = 0; i <= 6; i += 2)
            out.push(new VoidModem(`/dev/tnt${i}`, `/dev/tnt${i + 1}`));

        return out;

    })();

    public static get(): VoidModem {

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
