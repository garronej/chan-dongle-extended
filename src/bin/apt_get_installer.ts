import { execSync } from "child_process";

export function apt_get_install(
    package_name: string, 
    prog?: string
): void {

    process.stdout.write(`Checking for ${package_name} package ... `);

    if( !!prog && apt_get_install.doesHaveProg(prog) ){

        console.log(`${prog} executable found. OK`);

        return;

    }

    if (apt_get_install.isPkgInstalled(package_name)) {

        console.log(`${package_name} is installed. OK`);

        return;

    }

    process.stdout.write(`not found, installing ... `);

    try {

        if (apt_get_install.isFirst) {

            execSync("apt-get update");

            apt_get_install.isFirst = false;

        }

        execSync(`apt-get -y install ${package_name}`);

    } catch ({ message }) {

        console.log(`ERROR: ${message}`);

        process.exit(-1);

    }

    console.log("DONE");

}

export namespace apt_get_install {

    export let isFirst = true;

    export function isPkgInstalled(package_name: string): boolean {

        try {

            console.assert(
                !!execSync(`dpkg-query -W -f='\${Status}' ${package_name} 2>/dev/null`)
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

            execSync(`which ${prog}`);

        } catch{

            return false;

        }

        return true;

    }

}

function main() {

    console.log("---Installing required package for npm install---");

    apt_get_install("python", "python");
    //NOTE assume python 2 available. var range = semver.Range('>=2.5.0 <3.0.0')

    process.stdout.write(`Checking for python module virtualenv ... `);

    try {

        execSync(`which virtualenv`);

        console.log("found. OK");

    } catch{

        process.stdout.write(`not found, installing ... `);

        try {

            execSync(`pip install virtualenv`);

        } catch ({ message }) {

            console.log(`ERROR: ${message}`);

            process.exit(-1);

        }

        console.log("DONE");

    }

    apt_get_install("build-essential");

    apt_get_install("libudev-dev");

    console.log("---DONE---");

}

if (require.main === module) {

    main();

}
