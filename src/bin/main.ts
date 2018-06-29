import * as scriptLib from "scripting-tools";

scriptLib.createService({
    "rootProcess": async () => {

        const [
            { build_ast_cmdline, node_path, pidfile_path, unix_user },
            child_process,
            logger,
        ]= await Promise.all([
            import("./installer"),
            import("child_process"),
            import("logger")
        ]);

        const debug = logger.debugFactory();

        return {
            pidfile_path,
            "assert_unix_user": "root",
            "daemon_unix_user": unix_user,
            "daemon_node_path": node_path,
            "preForkTask": async terminateChildProcesses => {

                while (true) {

                    debug("Checking whether asterisk is fully booted...");

                    const isAsteriskFullyBooted = await new Promise<boolean>(resolve => {

                        const childProcess = child_process.exec(`${build_ast_cmdline()} -rx "core waitfullybooted"`);

                        childProcess.once("error", () => resolve(false))
                            .once("close", code => (code === 0) ? resolve(true) : resolve(false))
                            ;

                        terminateChildProcesses.impl = () => new Promise(resolve_ => {

                            resolve = () => resolve_();

                            childProcess.kill("SIGKILL");

                        });

                    });

                    if (isAsteriskFullyBooted) {

                        break;

                    }

                    debug("... asterisk is not running");

                    await new Promise(resolve => setTimeout(resolve, 10000));


                }

                debug("...Asterisk is fully booted!");

            }
        };

    },
    "daemonProcess": async () => {

        const [
            path,
            fs,
            { working_directory_path },
            logger,
            { launch, beforeExit }
        ] = await Promise.all([
            import("path"),
            import("fs"),
            import("./installer"),
            import("logger"),
            import("../lib/launch")
        ]);

        const logfile_path = path.join(working_directory_path, "log");

        return {
            "launch": () => {

                logger.file.enable(logfile_path);

                launch();

            },
            "beforeExitTask": async error => {

                if (!!error) {

                    logger.log(error);

                }

                await Promise.all([
                    logger.file.terminate().then(() => {

                        if (!!error) {

                            scriptLib.execSync(`mv ${logfile_path} ${path.join(path.dirname(logfile_path), "previous_crash.log")}`);

                        } else {

                            fs.unlinkSync(logfile_path);

                        }

                    }),
                    beforeExit()
                ]);

            }
        };

    }
});


