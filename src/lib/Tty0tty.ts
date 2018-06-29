import * as child_process from "child_process";

export class Tty0tty {

    public static makeFactory(): (() => Tty0tty) {

        const store: Tty0tty[] = (() => {

            //should return 24
            let pairCount = (child_process.execSync("ls /dev")
                .toString("utf8")
                .match(/(tnt[0-9]+)/g)!
                .length) / 2
                ;

            let out: Tty0tty[] = [];

            let index = 0;

            while (!!(pairCount--)) {

                out.push(new Tty0tty(`/dev/tnt${index++}`, `/dev/tnt${index++}`));

            }

            return out;

        })();

        return () => {

            let tty0tty = store.find(({ available }) => available);

            if (!tty0tty) {
                throw new Error("No more void modem available");
            }

            tty0tty.available = false;

            return tty0tty;

        };


    }

    private available = true;

    private constructor(
        public readonly leftEnd: string,
        public readonly rightEnd: string
    ) { }

    public release(): void {
        this.available = true;
    }

}
