import * as child_process from "child_process";
import * as readline from "readline";

export function colorize(str: string, color: "GREEN" | "RED" | "YELLOW"): string {

    let color_code = (() => {

        switch (color) {
            case "GREEN": return "\x1b[32m";
            case "RED": return "\x1b[31m";
            case "YELLOW": return "\x1b[33m";
        }

    })();

    return `${color_code}${str}\x1b[0m`;

}

export function showLoad(message: string): {
    onError(errorMessage: string): void;
    onSuccess(message?: string): void;
} {

    process.stdout.write(`${message}... `);

    const moveBack = (() => {

        let cp = message.length + 3;

        return () => readline.cursorTo(process.stdout, cp);

    })();

    let p = ["\\", "|", "/", "-"].map(i => colorize(i, "GREEN"));

    let x = 0;

    let timer = setInterval(() => {

        moveBack();

        process.stdout.write(p[x++]);

        x = x % p.length;

    }, 250);

    const onComplete = (message: string) => {

        clearInterval(timer);

        moveBack();

        process.stdout.write(`${message}\n`);

    };

    return {
        "onError": errorMessage => onComplete(colorize(errorMessage, "RED")),
        "onSuccess": message => onComplete(colorize(message || "ok", "GREEN"))
    };

};

export namespace showLoad {

    export function exec(
        cmd: string,
        onError: (errorMessage: string) => void
    ): Promise<string> {

        return new Promise(
            (resolve, reject)=>
                child_process.exec(cmd, (error, stdout, stderr)=>{

                    if( !!error){

                        onError(`${colorize("error with unix command:", "RED")} '${cmd}' message: ${error.message}`);

                        reject(error);

                    }else{

                        resolve(`${stdout}`);

                    }


                })
        );

    }

}


export async function apt_get_install(
    package_name: string,
    prog?: string
) {

    process.stdout.write(`Looking for ${package_name} ... `);

    if (!!prog && apt_get_install.doesHaveProg(prog)) {

        console.log(`${prog} executable found. ${colorize("OK", "GREEN")}`);

        return;

    }

    if (apt_get_install.isPkgInstalled(package_name)) {

        console.log(`${package_name} is installed. ${colorize("OK", "GREEN")}`);

        return;

    }

    readline.clearLine(process.stdout, 0);
    process.stdout.write("\r");

    let { onSuccess, onError } = showLoad(`Installing ${package_name} package`);

    try {

        if (apt_get_install.isFirst) {

            await showLoad.exec("apt-get update", onError);

            apt_get_install.isFirst = false;

        }

        await showLoad.exec(`apt-get -y install ${package_name}`, onError);

    } catch(error) {

        apt_get_install.onError(error);

    }

    onSuccess("DONE");

}

export namespace apt_get_install {

    export let onError= (error: Error) => { throw error };

    export let isFirst = true;

    export function isPkgInstalled(package_name: string): boolean {

        try {

            console.assert(
                !!child_process.execSync(`dpkg-query -W -f='\${Status}' ${package_name} 2>/dev/null`)
                    .toString("utf8")
                    .match(/^install ok installed$/)
            );

        } catch{

            return false;

        }

        return true;

    }

    export function doesHaveProg(prog: string): boolean {

        try {

            child_process.execSync(`which ${prog}`);

        } catch{

            return false;

        }

        return true;

    }

}

