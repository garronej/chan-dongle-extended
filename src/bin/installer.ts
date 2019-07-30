import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import * as crypto from "crypto";
import * as scriptLib from "scripting-tools";

export const unix_user_default = "chan_dongle";
export const srv_name = "chan_dongle";

const module_dir_path = path.join(__dirname, "..", "..");
const cli_js_path = path.join(__dirname, "cli.js");
export const working_directory_path = path.join(module_dir_path, "working_directory");
export const node_path = path.join(module_dir_path, "node");
const installed_pkg_record_path = path.join(module_dir_path, "pkg_installed.json");
export const pidfile_path = path.join(working_directory_path, "pid");
const uninstaller_link_default_path = `/usr/sbin/dongle_uninstaller`;


export const db_path = path.join(working_directory_path, "app.db");
const to_distribute_rel_paths = [
    "LICENSE",
    "README.md",
    `res/${path.basename(db_path)}`,
    "dist",
    "package.json"
];

//Must be after declaration of working_directory_path and unix_user
import { InstallOptions } from "../lib/InstallOptions";
import { Astdirs } from "../lib/Astdirs";
import { AmiCredential } from "../lib/AmiCredential";

export function getIsProd(): boolean {

    if (getIsProd.value !== undefined) {
        return getIsProd.value;
    }

    getIsProd.value = !fs.existsSync(path.join(module_dir_path, ".git"));

    return getIsProd();

}

export namespace getIsProd {
    export let value: boolean | undefined = undefined;
}

async function program_action_install_prereq() {

    await scriptLib.apt_get_install_if_missing("git", "git");

    await scriptLib.apt_get_install_if_missing("python", "python");
    //NOTE assume python 2 available. var range = semver.Range('>=2.5.0 <3.0.0')
    await scriptLib.apt_get_install_if_missing("python-pip", "pip");

    await (async function installVirtualenv() {

        process.stdout.write(`Checking for python module virtualenv ... `);

        try {

            scriptLib.execSyncQuiet(`which virtualenv`);

        } catch{

            readline.clearLine(process.stdout, 0);
            process.stdout.write("\r");

            const { exec, onSuccess } = scriptLib.start_long_running_process("Installing virtualenv");

            try {

                await scriptLib.exec(`pip install virtualenv`);


            } catch {

                await exec(`pip install -i https://pypi.python.org/simple/ --upgrade pip`);

                await exec(`pip install virtualenv`);

            }

            onSuccess("DONE");

            return;

        }

        console.log(`found. ${scriptLib.colorize("OK", "GREEN")}`);

    })();

    await scriptLib.apt_get_install_if_missing("build-essential");

    await scriptLib.apt_get_install_if_missing("libudev-dev");

};


async function program_action_install(options) {

    console.log(`---Installing ${srv_name}---`);

    if (
        fs.existsSync(uninstaller_link_default_path) &&
        path.dirname(scriptLib.sh_eval(`readlink -f ${uninstaller_link_default_path}`)) !== working_directory_path
    ) {

        process.stdout.write(scriptLib.colorize("Uninstalling previous instal found in other location... ", "YELLOW"));

        scriptLib.execSync(`${uninstaller_link_default_path} run`);

        console.log(scriptLib.colorize("DONE", "GREEN"));

    }

    uninstall();

    try {

        await install(options);

    } catch ({ message }) {

        console.log(scriptLib.colorize(`An error occurred: '${message}`, "RED"));

        uninstall();

        if (getIsProd()) {

            scriptLib.execSync(`rm -r ${module_dir_path}`);

        }

        process.exit(-1);

        return;

    }

    console.log("---DONE---");

    process.exit(0);

}

async function program_action_uninstall() {

    console.log(`---Uninstalling ${srv_name}---`);

    uninstall("VERBOSE");

    console.log("---DONE---");

    if (fs.existsSync(installed_pkg_record_path)) {

        console.log([
            "NOTE: Some packages have been installed automatically, ",
            "you can remove them if you no longer need them.",
            "\n",
            `$ sudo apt-get purge ${require(installed_pkg_record_path).join(" ")}`,
            "\n",
            `$ sudo apt-get --purge autoremove`
        ].join(""));

    }

    process.exit(0);
}

async function program_action_update(options) {

    if (!getIsProd()) {
        console.log(scriptLib.colorize("Should not update dev", "RED"));
        process.exit(1);
    }

    scriptLib.stopProcessSync(pidfile_path, "SIGUSR2");

    scriptLib.enableCmdTrace();

    const _module_dir_path = options["path"];

    const [db_schema_path, _db_schema_path] = [module_dir_path, _module_dir_path].map(v => path.join(v, "res", path.basename(db_path)));

    if (!scriptLib.fs_areSame(db_schema_path, _db_schema_path)) {

        scriptLib.fs_move("COPY", _db_schema_path, db_path);

        const unix_user= InstallOptions.get().unix_user;

        scriptLib.execSync(`chown ${unix_user}:${unix_user} ${db_path}`);

    }


    for (const moduleName of ["udev","node-python-messaging"] as const) {

        const [
            target_module_dir_path,
            _target_module_dir_path
        ] = [module_dir_path, _module_dir_path]
            .map(v => {
                try {
                    return scriptLib.find_module_path(moduleName, v);
                } catch{
                    return "";
                }
            });

        if (!target_module_dir_path || !_target_module_dir_path) {
            continue;
        }

        if (
            moduleName === "udev" && 
            !scriptLib.fs_areSame(node_path, path.join(_module_dir_path, "node"))
        ) {
            //NOTE: node have changes since last version
            continue;
        }

        if(
                path.relative(module_dir_path, target_module_dir_path)
                !==
                path.relative(_module_dir_path, _target_module_dir_path)
        ){
            //NOTE: The new version of the package is not installed in the same location.
            continue;
        }

        if( !([target_module_dir_path, _target_module_dir_path]
            .map(dir_path => path.join(dir_path, "package.json"))
            .map(file_path => require(file_path).version)
            .every((v, _index, [v0]) => v === v0))
        ){
            //NOTE: The package have been updated.
            continue;
        }

        //NOTE: Nothing have changed, we can keep the old version of the package.
        scriptLib.fs_move("MOVE", target_module_dir_path, _target_module_dir_path);

    }

    for (const name of [...to_distribute_rel_paths, "node_modules", "node"]) {
        scriptLib.fs_move("MOVE", _module_dir_path, module_dir_path, name);
    }

    if (!InstallOptions.get().do_not_create_systemd_conf) {

        scriptLib.execSync(`systemctl start ${srv_name}`);

    }

    console.log(scriptLib.colorize("Update success", "GREEN"));

}

async function program_action_release() {

    scriptLib.enableCmdTrace();

    const tmp_dir_path = path.join("/tmp", `dongle_release_${Date.now()}`);

    scriptLib.execSyncTrace(`rm -rf ${tmp_dir_path} && mkdir ${tmp_dir_path}`);

    const _module_dir_path = path.join(tmp_dir_path, path.basename(module_dir_path));

    for (const name of to_distribute_rel_paths) {
        scriptLib.fs_move("COPY", module_dir_path, _module_dir_path, name);
    }

    const arch = scriptLib.sh_eval("uname -m");

    const deps_digest_filename = "dependencies.md5";

    const deps_digest = crypto
        .createHash("md5")
        .update(
            Buffer.from(
                JSON.stringify(
                    require(
                        path.join(module_dir_path, "package-lock.json")
                    )["dependencies"]
                ),
                "utf8"
            )
        )
        .digest("hex")
        ;


    let node_modules_need_update: boolean;

    const putasset_target = {
        "owner": "garronej",
        "repo": "releases",
        "tag": "chan-dongle-extended"
    };

    const releases_index_file_path = path.join(tmp_dir_path, "index.json");

    const releases_index_file_url = [
        "https://github.com",
        putasset_target.owner,
        putasset_target.repo,
        "releases",
        "download",
        putasset_target.tag,
        path.basename(releases_index_file_path)
    ].join('/');

    const fetch_releases_index = async () =>
        JSON.parse(
            await scriptLib.web_get(releases_index_file_url)
        );

    let releases_index = await fetch_releases_index();

    const last_version = releases_index[arch];

    const previous_release_dir_path = path.join(tmp_dir_path, "previous_release");

    if (last_version === undefined) {

        node_modules_need_update = true;

    } else {


        await scriptLib.download_and_extract_tarball(
            releases_index[last_version],
            previous_release_dir_path,
            "OVERWRITE IF EXIST"
        );

        node_modules_need_update = fs.readFileSync(
            path.join(previous_release_dir_path, deps_digest_filename)
        ).toString("utf8") !== deps_digest;

    }

    if (!node_modules_need_update) {

        console.log("node_modules haven't change since last release");

        for (let name of ["node_modules", "node", deps_digest_filename]) {

            scriptLib.execSyncTrace(`mv ${name} ${_module_dir_path}`, { "cwd": previous_release_dir_path });

        }

    } else {

        console.log("Need to update node_module");

        scriptLib.execSyncTrace(
            [
                `sudo`,
                `env "PATH=${path.dirname(process.argv[0])}:${process.env["PATH"]}"`,
                `npm install --production --unsafe-perm`,
            ].join(" "),
            { "cwd": _module_dir_path }
        );

        scriptLib.execSyncTrace(`rm package-lock.json`, { "cwd": _module_dir_path });

        fs.writeFileSync(
            path.join(_module_dir_path, deps_digest_filename),
            Buffer.from(deps_digest, "utf8")
        );

        const _node_modules_path = path.join(_module_dir_path, "node_modules");

        scriptLib.execSyncTrace([
            "rm -r",
            path.join(
                scriptLib.find_module_path("node-python-messaging", _module_dir_path),
                "dist", "virtual"
            ),
            path.join(
                scriptLib.find_module_path("udev", _module_dir_path),
                "build"
            )
        ].join(" "));

        scriptLib.execSyncTrace(`find ${_node_modules_path} -type f -name "*.ts" -exec rm -rf {} \\;`);

        (function hide_auth_token() {

            const files = scriptLib.execSync(
                `find . -name "package-lock.json" -o -name "package.json"`,
                { "cwd": _module_dir_path }
            )
                .slice(0, -1)
                .split("\n")
                .map(rp => path.join(_module_dir_path, rp));

            for (let file of files) {

                fs.writeFileSync(
                    file,
                    Buffer.from(
                        fs.readFileSync(file)
                            .toString("utf8")
                            .replace(/[0-9a-f]+:x-oauth-basic/g, "xxxxxxxxxxxxxxxx"),
                        "utf8"
                    )
                );

            }

        })();

    }

    const { version } = require(path.join(module_dir_path, "package.json"));

    const tarball_file_path = path.join(tmp_dir_path, `dongle_${version}_${arch}.tar.gz`);

    scriptLib.execSyncTrace([
        "tar -czf",
        tarball_file_path,
        `-C ${_module_dir_path} .`
    ].join(" "));

    const putasset_dir_path = path.join(tmp_dir_path, "node-putasset");

    scriptLib.execSyncTrace(
        `git clone https://github.com/garronej/node-putasset`,
        { "cwd": path.join(putasset_dir_path, "..") }
    );

    scriptLib.execSyncTrace(
        [
            `sudo`,
            `env "PATH=${path.dirname(process.argv[0])}:${process.env["PATH"]}"`,
            `npm install --production --unsafe-perm`,
        ].join(" "),
        { "cwd": putasset_dir_path }
    );

    const uploadAsset = (file_path: string) => scriptLib.sh_eval(
        [
            `${process.argv[0]} ${path.join(putasset_dir_path, "bin", "putasset.js")}`,
            `-k ` + fs.readFileSync(path.join(module_dir_path, "res", "PUTASSET_TOKEN"))
                .toString("utf8")
                .replace(/\s/g, ""),
            `-r ${putasset_target.repo}`,
            `-o ${putasset_target.owner}`,
            `-t ${putasset_target.tag}`,
            `-f "${file_path}"`,
            `--force`
        ].join(" ")
    );

    console.log("Start uploading...");

    const tarball_file_url = uploadAsset(tarball_file_path);

    releases_index = await fetch_releases_index();

    releases_index[releases_index[arch] = `${version}_${arch}`] = tarball_file_url;

    fs.writeFileSync(
        releases_index_file_path,
        Buffer.from(
            JSON.stringify(releases_index, null, 2),
            "utf8"
        )
    );

    uploadAsset(releases_index_file_path);

    scriptLib.execSync(`rm -r ${tmp_dir_path}`);

    console.log("---DONE---");

}

async function install(options: Partial<InstallOptions>) {

    scriptLib.execSync(`mkdir ${working_directory_path}`);

    InstallOptions.set(options);

    const unix_user = InstallOptions.get().unix_user;

    if (unix_user === unix_user_default) {

        scriptLib.unixUser.create(unix_user, working_directory_path);

    } else {

        if (!scriptLib.sh_if(`id -u ${unix_user}`)) {

            throw new Error(`Unix user ${unix_user} does not exist`);

        }

    }

    scriptLib.execSync(`chown ${unix_user}:${unix_user} ${working_directory_path}`);

    if (getIsProd()) {

        await program_action_install_prereq();

        await rebuild_node_modules_if_needed();

    } else {

        if (!fs.existsSync(node_path)) {
            throw new Error(`${node_path} is missing`);
        }

        scriptLib.enableCmdTrace();

    }


    if (!InstallOptions.getDeduced().assume_asterisk_installed) {

        await apt_get_install_asterisk();

    }

    Astdirs.set(InstallOptions.get().asterisk_main_conf);

    modemManager.disable_and_stop();

    await tty0tty.install();

    if (!InstallOptions.get().assume_chan_dongle_installed) {

        await asterisk_chan_dongle.build(
            Astdirs.get().astmoddir,
            InstallOptions.get().ast_include_dir_path,
            build_ast_cmdline()
        );

    }

    asterisk_chan_dongle.linkDongleConfigFile();

    await udevRules.create();

    shellScripts.create();

    await asterisk_manager.enable();

    scriptLib.execSync(
        `cp ${path.join(module_dir_path, "res", path.basename(db_path))} ${db_path}`,
        { "uid": scriptLib.get_uid(unix_user), "gid": scriptLib.get_gid(unix_user) }
    );

    if (!InstallOptions.get().do_not_create_systemd_conf) {

        scriptLib.systemd.createConfigFile(
            srv_name, path.join(__dirname, "main.js"), node_path, "ENABLE", "START"
        );

    }

}

function uninstall(verbose: false | "VERBOSE" = false) {

    const write: (str: string) => void = !!verbose ? process.stdout.write.bind(process.stdout) : (() => { });
    const log = (str: string) => write(`${str}\n`);

    const runRecover = async (description: string, action: () => void) => {

        write(description);

        try {

            action();


        } catch ({ message }) {

            log(scriptLib.colorize(message, "RED"));

        }

        log(scriptLib.colorize("ok", "GREEN"));

    }
    runRecover("Stopping running instance ... ", () => scriptLib.stopProcessSync(pidfile_path, "SIGUSR2"));

    runRecover("Removing systemd config file ... ", () => scriptLib.systemd.deleteConfigFile(srv_name));

    runRecover("Uninstalling chan_dongle.so ... ", () => asterisk_chan_dongle.remove());

    runRecover("Restoring asterisk manager ... ", () => asterisk_manager.restore());

    runRecover("Removing binary symbolic links ... ", () => shellScripts.remove_symbolic_links());

    runRecover("Removing udev rules ... ", () => udevRules.remove());

    runRecover("Removing tty0tty kernel module ...", () => tty0tty.remove());

    runRecover("Removing app working directory ... ", () => scriptLib.execSyncQuiet(`rm -r ${working_directory_path}`));

    runRecover(`Deleting ${unix_user_default} unix user ... `, () => scriptLib.unixUser.remove(unix_user_default));

    runRecover("Re enabling ModemManager if present...", () => modemManager.enable_and_start());

}

export namespace tty0tty {

    const h_dir_path = path.join(working_directory_path, "linux-headers");

    const build_link_path = "/lib/modules/$(uname -r)/build";

    async function remove_local_linux_headers() {

        try {

            await scriptLib.exec(`rm -r ${h_dir_path}`);

        } catch{

            return;

        }

        scriptLib.execSync(`rm ${build_link_path}`);

    }

    async function install_linux_headers() {

        let kernel_release = scriptLib.execSync("uname -r").replace(/\n$/, "");

        process.stdout.write("Checking for linux kernel headers ...");

        if (fs.existsSync(path.join(build_link_path, "include"))) {

            console.log(`found. ${scriptLib.colorize("OK", "GREEN")}`);

            return;
        }

        readline.clearLine(process.stdout, 0);
        process.stdout.write("\r");

        const is_raspbian_host = !!scriptLib.execSync("cat /etc/os-release").match(/^NAME=.*Raspbian.*$/m);

        if (!is_raspbian_host) {

            await scriptLib.apt_get_install_if_missing(`linux-headers-$(uname -r)`);

            return;

        }

        const h_deb_path = path.join(working_directory_path, "linux-headers.deb");

        const web_get = async (url: string) => {

            let attemptRemaining = 10;

            while (true) {

                attemptRemaining--;

                try {

                    await scriptLib.web_get(url, h_deb_path);

                } catch (e) {

                    const error: scriptLib.web_get.DownloadError = e;

                    if (attemptRemaining !== 0) {

                        if (error.cause === "HTTP ERROR CODE") {

                            const error: scriptLib.web_get.DownloadErrorHttpErrorCode = e;

                            if (error.code !== 503) {

                                throw error;

                            }

                        }

                        console.log(`Fail downloading ${url} ${error.message}, retrying`);

                        await new Promise(resolve => setTimeout(resolve, 5000));

                        continue;

                    } else {

                        throw error;

                    }

                }

                break;

            }

        };

        let downloaded_from: "OFFICIAL" | "MHIIENKA";

        await (async function download_deb() {

            const { onError, onSuccess } = scriptLib.start_long_running_process("Downloading raspberrypi linux headers");

            try {

                const firmware_release = scriptLib.execSync("zcat /usr/share/doc/raspberrypi-bootloader/changelog.Debian.gz | head")
                    .match(/^[^r]*raspberrypi-firmware\ \(([^\)]+)\)/)![1]
                    ;

                const url = [
                    "https://archive.raspberrypi.org/debian/pool/main/r/raspberrypi-firmware/",
                    `raspberrypi-kernel-headers_${firmware_release}_armhf.deb`
                ].join("");

                await web_get(url);

                downloaded_from = "OFFICIAL";

            } catch{

                try {

                    const url = [
                        "https://www.niksula.hut.fi/~mhiienka/Rpi/linux-headers-rpi" + (kernel_release[0] === "3" ? "/3.x.x/" : "/"),
                        `linux-headers-${kernel_release}_${kernel_release}-2_armhf.deb`
                    ].join("");

                    await web_get(url);

                    downloaded_from = "MHIIENKA";

                } catch{

                    onError("linux-kernel headers for raspberry pi not found");

                    throw new Error()

                }

            }

            onSuccess("DONE");


        }());

        await (async function install_deb() {

            if (downloaded_from! === "MHIIENKA") {

                for (const pkg_name of ["gcc-4.7", "bc", "dkms"]) {

                    await scriptLib.apt_get_install(pkg_name);

                }

            }

            const { exec, onSuccess } = scriptLib.start_long_running_process("Installing linux headers");

            if (downloaded_from! === "OFFICIAL") {

                await exec(`dpkg -x ${h_deb_path} ${h_dir_path}`);

                await exec(`rm ${h_deb_path}`);

                let build_dir_path = path.join(h_dir_path, "usr", "src", `linux-headers-${kernel_release}`);

                //Suppress the source for the other version (+v7)
                scriptLib.execSyncQuiet(`mv ${path.join(h_dir_path, "usr", "src", kernel_release)} ${build_dir_path} || true`);

                scriptLib.execSync(`ln -sf ${build_dir_path} ${build_link_path}`);

            } else {

                await exec(`dpkg -i ${h_deb_path}`);

                await exec(`rm ${h_deb_path}`);

                //TODO: for uninstalling:  dpkg -r linux-headers-$(uname -r)

            }

            onSuccess("DONE");

        })();

    }

    const load_module_file_path = "/etc/modules";
    export const ko_file_path = "/lib/modules/$(uname -r)/kernel/drivers/misc/tty0tty.ko";

    export async function install() {

        await install_linux_headers();

        await scriptLib.apt_get_install_if_missing("git", "git");

        const { exec, onSuccess } = scriptLib.start_long_running_process("Building and installing tty0tty kernel module");

        const tty0tty_dir_path = path.join(working_directory_path, "tty0tty");

        const cdExec = (cmd: string) => exec(cmd, { "cwd": path.join(tty0tty_dir_path, "module") });

        await exec(`git clone https://github.com/garronej/tty0tty ${tty0tty_dir_path}`);

        await cdExec("make");

        await remove_local_linux_headers();

        await cdExec(`cp tty0tty.ko ${ko_file_path}`);

        await exec(`rm -r ${tty0tty_dir_path}`);

        await exec("depmod");

        await exec("modprobe tty0tty");

        try {

            scriptLib.execSyncQuiet(`cat ${load_module_file_path} | grep tty0tty`);

        } catch {

            await exec(`echo tty0tty >> ${load_module_file_path}`);

        }

        onSuccess("OK");

    }

    export function remove() {

        fs.writeFileSync(
            load_module_file_path,
            Buffer.from(
                `${fs.readFileSync(load_module_file_path)}`.replace(/tty0tty\n?/g, ""),
                "utf8"
            )
        );

        scriptLib.execSyncQuiet(`rm -f ${ko_file_path}`);

    }

    export async function re_install_if_needed() {

        while (!scriptLib.sh_if(`test -e "${tty0tty.ko_file_path}"`)) {

            console.log("Linux kernel updated, need to rebuild tty0tty...");

            try {

                await tty0tty.install();

            } catch (error) {

                console.log("Building tty0tty failed", error);

            }

        }

    }

}

namespace asterisk_chan_dongle {


    export function linkDongleConfigFile(): void {

        const { astetcdir } = Astdirs.get();

        let dongle_etc_path = path.join(astetcdir, "dongle.conf");
        let dongle_loc_path = path.join(working_directory_path, "dongle.conf");

        scriptLib.execSync(`touch ${dongle_etc_path}`);

        scriptLib.execSync(`mv ${dongle_etc_path} ${dongle_loc_path}`);

        (() => {

            const unix_user = InstallOptions.get().unix_user;

            scriptLib.execSync(`chown ${unix_user}:${unix_user} ${dongle_loc_path}`);

        })();


        scriptLib.execSync(`ln -s ${dongle_loc_path} ${dongle_etc_path}`);

        scriptLib.execSync(`chmod u+rw,g+r,o+r ${dongle_loc_path}`);

    }

    export async function build(
        dest_dir_path: string,
        ast_include_dir_path: string,
        ast_cmdline: string
    ) {

        const src_dir_path = path.join(dest_dir_path, "asterisk-chan-dongle");

        await scriptLib.apt_get_install_if_missing("git", "git");

        await scriptLib.apt_get_install_if_missing("automake");

        const { exec, onSuccess } = scriptLib.start_long_running_process(
            `Building and installing asterisk chan_dongle ( may take several minutes )`
        );

        const ast_ver = scriptLib.sh_eval(`${ast_cmdline} -V`).match(/^Asterisk\s+([0-9\.]+)/)![1];

        const cdExec = (cmd: string) => exec(cmd, { "cwd": src_dir_path });

        //const repoHost= "garronej";
        const repoHost= "wdoekes";
        const commit= "fd544d628d134cfe9cc2df6b5315298e93698664";

        await exec(`git clone https://github.com/${repoHost}/asterisk-chan-dongle ${src_dir_path}`);

        await cdExec(`git checkout ${commit}`);

        await cdExec("./bootstrap");

        await cdExec(`./configure --with-astversion=${ast_ver} --with-asterisk=${ast_include_dir_path} DESTDIR=${dest_dir_path}`);

        await cdExec("make");

        await exec(`rm -r ${src_dir_path}`);

        onSuccess("OK");

    }

    export function remove() {

        const { astmoddir, astetcdir } = Astdirs.get();

        scriptLib.execSyncQuiet(`rm -rf ${path.join(astetcdir, "dongle.conf")}`);

        try {

            scriptLib.execSyncQuiet(
                `${build_ast_cmdline()} -rx "module unload chan_dongle.so"`,
                { "timeout": 5000 }
            );

        } catch{ }

        scriptLib.execSyncQuiet(`rm -f ${path.join(astmoddir, "chan_dongle.so")}`);

    }

}

namespace shellScripts {

    const get_uninstaller_link_path = () => path.join(Astdirs.get().astsbindir, path.basename(uninstaller_link_default_path));

    const cli_link_path = "/usr/bin/dongle";

    export function create(): void {

        process.stdout.write(`Creating launch scripts ... `);

        const cli_sh_path = path.join(working_directory_path, "cli.sh");

        scriptLib.createScript(
            cli_sh_path,
            [
                `#!/usr/bin/env bash`,
                ``,
                `# This script is a proxy to the cli interface of the service ( run $ dongle --help )`,
                `# It is in charge of calling the cli.js with the right $HOME, via the bundled`,
                `# version of node.js`,
                ``,
                `cd ${working_directory_path}`,
                `args=""`,
                `for param in "$@"`,
                `do`,
                `   args="$args \\"$param\\""`,
                `done`,
                `eval "${node_path} ${cli_js_path} $args"`,
                ``
            ].join("\n")
        );

        scriptLib.execSyncQuiet(`ln -sf ${cli_sh_path} ${cli_link_path}`);

        const uninstaller_sh_path = path.join(working_directory_path, "uninstaller.sh");

        scriptLib.createScript(
            uninstaller_sh_path,
            [
                `#!/usr/bin/env bash`,
                ``,
                `# Will uninstall the service and remove source if installed from tarball`,
                ``,
                `if [ "$1" == "run" ]`,
                `then`,
                `   if [[ $EUID -ne 0 ]]; then`,
                `       echo "This script require root privileges."`,
                `       exit 1`,
                `   fi`,
                `   ${node_path} ${__filename} uninstall`,
                `   ${getIsProd() ? `rm -r ${module_dir_path}` : ""}`,
                `else`,
                `   echo "If you wish to uninstall chan-dongle-extended call this script with 'run' as argument:"`,
                `   echo "$0 run"`,
                `fi`,
                ``
            ].join("\n")
        );

        scriptLib.createSymlink(uninstaller_sh_path, get_uninstaller_link_path());

        console.log(scriptLib.colorize("OK", "GREEN"));

    }

    export function remove_symbolic_links() {

        scriptLib.execSyncQuiet(`rm -f ${cli_link_path} ${get_uninstaller_link_path()}`);

    }

}

namespace asterisk_manager {

    const ami_conf_back_path = path.join(working_directory_path, "manager.conf.back");
    const get_ami_conf_path = () => path.join(Astdirs.get().astetcdir, "manager.conf");

    export async function enable() {

        const { ini } = await import("ini-extended");

        process.stdout.write(`Enabling asterisk manager ... `);

        const ami_conf_path = get_ami_conf_path();

        const general: any = {
            "enabled": "yes",
            "port": InstallOptions.get().enable_ast_ami_on_port,
            "bindaddr": "127.0.0.1",
            "displayconnects": "yes"
        };

        if (!fs.existsSync(ami_conf_path)) {

            const stat = fs.statSync(InstallOptions.get().asterisk_main_conf);

            child_process.execSync(`touch ${ami_conf_path}`, {
                "uid": stat.uid,
                "gid": stat.gid
            });

            scriptLib.execSync(`chmod 640 ${ami_conf_path}`);

        } else {

            scriptLib.execSync(`cp -p ${ami_conf_path} ${ami_conf_back_path}`);

            //TODO: test if return {} when empty file
            const parsed_general = ini.parseStripWhitespace(
                fs.readFileSync(ami_conf_path).toString("utf8")
            )["general"] || {};

            for (let key in parsed_general) {

                switch (key) {
                    case "enabled": break;
                    case "port":
                        if (!InstallOptions.getDeduced().overwrite_ami_port_if_enabled) {
                            general["port"] = parsed_general["port"];
                        }
                        break;
                    default: general[key] = parsed_general[key];
                }

            }

        }

        const credential = {
            "host": "127.0.0.1",
            "port": general["port"],
            "user": "chan_dongle_extended",
            "secret": `${Date.now()}`
        };

        fs.writeFileSync(
            ami_conf_path,
            Buffer.from(ini.stringify({
                general,
                [credential.user]: {
                    "secret": credential.secret,
                    "deny": "0.0.0.0/0.0.0.0",
                    "permit": "0.0.0.0/0.0.0.0",
                    "read": "all",
                    "write": "all",
                    "writetimeout": "5000"
                }
            }), "utf8")
        );

        try {

            scriptLib.execSyncQuiet(
                `${build_ast_cmdline()} -rx "core restart now"`,
                { "timeout": 5000 }
            );

        } catch{ }

        AmiCredential.set(credential);

        console.log(scriptLib.colorize("OK", "GREEN"));

    }

    export function restore() {

        scriptLib.execSyncQuiet(`rm -f ${get_ami_conf_path()}`);

        if (fs.existsSync(ami_conf_back_path)) {

            scriptLib.execSyncQuiet(`mv ${ami_conf_back_path} ${get_ami_conf_path()}`);

        }

        try {

            scriptLib.execSyncQuiet(
                `${build_ast_cmdline()} -rx "core restart now"`,
                { "timeout": 5000 }
            );

        } catch{ }

    }

}

namespace udevRules {

    const rules_path = path.join("/etc/udev/rules.d", `98-${srv_name}.rules`);

    export async function create() {

        await scriptLib.apt_get_install("usb-modeswitch");

        //NOTE: we could grant access only to "dongle" group as asterisk is added to this group but need restart ast...

        process.stdout.write(`Creating udev rules ${rules_path} ... `);

        scriptLib.execSync(`mkdir -p ${path.dirname(rules_path)}`);

        const unix_user = InstallOptions.get().unix_user;
        const { recordIfNum, ConnectionMonitor } = await import("ts-gsm-modem");
        const vendorIds = Object.keys(recordIfNum);

        let rules = "# Automatically generated by chan-dongle-extended. (disable network on dongles )\n\n";

        for (let vendorId of vendorIds) {

            rules += [
                `ACTION=="add"`,
                `ENV{ID_VENDOR_ID}=="${vendorId}"`,
                `ENV{SUBSYSTEM}=="tty"`,
                `ENV{ID_USB_INTERFACE_NUM}=="[0-9]*"`,
                `MODE="0666"`,
                `GROUP="${unix_user}"`
            ].join(", ") + `\n`;

            rules += [
                `ACTION=="add"`,
                `ENV{ID_VENDOR_ID}=="${vendorId}"`,
                `ENV{SUBSYSTEM}=="net"`,
                `ENV{ID_USB_INTERFACE_NUM}=="[0-9]*"`,
                `RUN+="/bin/sh -c 'echo 0 > /sys$DEVPATH/device/authorized'"`
            ].join(", ") + `\n`;

        }

        rules += [
            `ACTION=="add"`,
            `ENV{DEVPATH}=="/devices/virtual/tty/tnt[0-9]*"`,
            `MODE="0666"`,
            `GROUP="${unix_user}"`
        ].join(", ") + `\n`;

        fs.writeFileSync(rules_path, rules);

        scriptLib.execSync("systemctl restart udev.service");

        console.log(scriptLib.colorize("OK", "GREEN"));

        scriptLib.execSync(`chown ${unix_user}:${unix_user} ${rules_path}`);

        await (async function applying_rules() {

            scriptLib.execSync(`chown root:${unix_user} /dev/tnt*`);

            scriptLib.execSync("chmod u+rw,g+rw,o+rw /dev/tnt*");

            let monitor = ConnectionMonitor.getInstance(console.log.bind(console));

            console.log("Detecting currently connected modems ... ");

            await new Promise<void>(resolve => setTimeout(() => resolve(), 4100));

            if (!monitor.connectedModems.size) {

                console.log("No USB dongles currently connected.");

            }

            for (let accessPoint of monitor.connectedModems) {

                for (let device_path of [accessPoint.audioIfPath, accessPoint.dataIfPath]) {

                    scriptLib.execSync(`chown root:${unix_user} ${device_path}`);

                    scriptLib.execSync(`chmod u+rw,g+rw,o+rw ${device_path}`);

                }


            }

        })();

    }

    export function remove() {

        scriptLib.execSyncQuiet(`rm -rf ${rules_path}`);

        scriptLib.execSyncQuiet("systemctl restart udev.service");

    }

}

async function apt_get_install_asterisk() {

    if (
        scriptLib.apt_get_install_if_missing.doesHaveProg("asterisk") &&
        !scriptLib.apt_get_install_if_missing.isPkgInstalled("asterisk")
    ) {

        //Custom install, we do not install from repositories.
        return;

    }

    if (!scriptLib.apt_get_install_if_missing.isPkgInstalled("asterisk")) {

        //If asterisk is not installed make sure asterisk-config is purged so the config files will be re-generated.
        scriptLib.execSyncQuiet("dpkg -P asterisk-config");

    }

    const pr_install_ast = scriptLib.apt_get_install_if_missing("asterisk-dev");

    //HOTFIX: On old version of raspberry pi install crash because timeout is reached.

    const service_path = "/lib/systemd/system/asterisk.service";

    const watcher = fs.watch(path.dirname(service_path), (event, filename) => {

        if (
            event === 'rename' &&
            filename === path.basename(service_path) &&
            fs.existsSync(service_path)
        ) {

            fs.writeFileSync(service_path,
                Buffer.from(
                    fs.readFileSync(service_path).toString("utf8").replace(
                        "\n[Service]\n", "\n[Service]\nTimeoutSec=infinity\n"
                    ),
                    "utf8"
                )
            );

            scriptLib.execSync("systemctl daemon-reload");

        }

    });

    await pr_install_ast;

    watcher.close();

}

namespace modemManager {

    export function disable_and_stop() {

        try {

            scriptLib.execSyncQuiet("systemctl stop ModemManager");

            console.log(scriptLib.colorize([
                "ModemManager was previously managing dongles on this host, is has been disabled. ",
                "You need to disconnect and reconnect your GSM dongles"
            ].join("\n"), "YELLOW"));

        } catch{ }

        try {

            scriptLib.execSyncQuiet("systemctl disable ModemManager");

        } catch{ }

    }

    export function enable_and_start() {

        try {

            scriptLib.execSyncQuiet("systemctl enable ModemManager");

        } catch{ }

        try {

            scriptLib.execSyncQuiet("systemctl start ModemManager");

        } catch{ }

    }

}


export function build_ast_cmdline(): string {

    const { ld_library_path_for_asterisk, asterisk_main_conf } = InstallOptions.get();

    return build_ast_cmdline.build_from_args(
        ld_library_path_for_asterisk,
        asterisk_main_conf
    );

}

export namespace build_ast_cmdline {

    export function build_from_args(
        ld_library_path_for_asterisk: string,
        asterisk_main_conf: string
    ): string {

        return [
            `LD_LIBRARY_PATH=${ld_library_path_for_asterisk}`,
            path.join(Astdirs.getStatic(asterisk_main_conf).astsbindir, "asterisk"),
            `-C ${asterisk_main_conf}`
        ].join(" ");

    }

}

export async function rebuild_node_modules_if_needed() {

    const { exec, onSuccess } = scriptLib.start_long_running_process("Building node_modules dependencies if needed");

    await (async function build_udev() {

        let udev_dir_path: string;
        try {
            udev_dir_path = scriptLib.find_module_path("udev", module_dir_path);
        } catch{
            return;
        }

        const libudev_dev_version = scriptLib.sh_eval("dpkg -s libudev-dev | grep -i version");
        const udev_build_dir_path = path.join(udev_dir_path, "build");
        const libudev_dev_version_path = path.join(udev_build_dir_path, "libudev_dev_version.txt");

        if (
            fs.existsSync(udev_build_dir_path) &&
            (
                !fs.existsSync(libudev_dev_version_path) ||
                libudev_dev_version === fs.readFileSync(libudev_dev_version_path).toString("utf8")
            )
        ) {
            return;
        }

        let pre_gyp_dir_path = "";

        for (const _module_dir_path of [udev_dir_path, module_dir_path]) {

            try {

                pre_gyp_dir_path = scriptLib.find_module_path("node-pre-gyp", _module_dir_path);

                break;

            } catch{ }

        }

        scriptLib.execSync(`rm -rf ${udev_build_dir_path}`);

        await exec(
            [
                `PATH=${path.join(module_dir_path)}:$PATH`,
                `${path.basename(node_path)} ${path.join(pre_gyp_dir_path, "bin", "node-pre-gyp")} install`,
                "--fallback-to-build"
            ].join(" "),
            { "cwd": udev_dir_path }
        );

        fs.writeFileSync(
            libudev_dev_version_path,
            Buffer.from(libudev_dev_version, "utf8")
        );

    })();

    await (async function postinstall_node_python_messaging() {

        let node_python_messaging_dir_path: string;
        try {
            node_python_messaging_dir_path = scriptLib.find_module_path(
                "node-python-messaging", module_dir_path
            );
        } catch{
            return;
        }

        if (fs.existsSync(path.join(node_python_messaging_dir_path, "dist", "virtual"))) {
            return;
        }

        await exec(
            "./install-python-dep.sh",
            { "cwd": node_python_messaging_dir_path }
        );

    })();

    onSuccess("DONE");

}

if (require.main === module) {

    process.once("unhandledRejection", error => { throw error; });

    scriptLib.exit_if_not_root();

    scriptLib.apt_get_install.onInstallSuccess = package_name =>
        scriptLib.apt_get_install.record_installed_package(installed_pkg_record_path, package_name);

    import("commander").then(program => {

        {

            let _install = program.command("install");

            for (let key in InstallOptions.defaults) {

                let value = InstallOptions.defaults[key];

                switch (typeof value) {
                    case "string":
                        _install = _install.option(`--${key} [{${key}}]`, `default: ${value}`);
                        break;
                    case "number":
                        _install = _install.option(`--${key} <{${key}}>`, `default: ${value}`, parseInt);
                        break;
                    case "boolean":
                        _install = _install.option(`--${key}`, `default: ${value}`);
                        break;
                }

            }

            _install.action(options => program_action_install(options));

        }

        program
            .command("uninstall")
            .action(() => program_action_uninstall())
            ;

        program
            .command("update")
            .option(`--path [{path}]`)
            .action(options => program_action_update(options))
            ;

        program
            .command("release")
            .action(() => program_action_release())
            ;

        program
            .command("install_prereq")
            .action(() => program_action_install_prereq())
            ;

        program
            .command("build-asterisk-chan-dongle")
            .usage("Only generate chan_dongle.so ( asterisk module )")
            .option("--dest_dir [{dest_dir}]")
            .option("--asterisk_main_conf [{asterisk_main_conf}]")
            .option("--ast_include_dir_path [{ast_include_dir_path}]")
            .option("--ld_library_path_for_asterisk [{ld_library_path_for_asterisk}]")
            .action(options => asterisk_chan_dongle.build(
                options["dest_dir"] || process.cwd(),
                options["ast_include_dir_path"] || "/usr/include",
                build_ast_cmdline.build_from_args(
                    options["ld_library_path_for_asterisk"] || "",
                    options["asterisk_main_conf"] || "/etc/asterisk/asterisk.conf"
                )
            ))
            ;

        program
            .command("re-install-tty0tty-if-needed")
            .action(() => tty0tty.re_install_if_needed())
            ;

        program.parse(process.argv);

    });

}

