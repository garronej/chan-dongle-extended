import * as scriptLib from "scripting-tools";

scriptLib.createService({
    "rootProcess": async () => {

        const [
            { build_ast_cmdline, node_path, pidfile_path, srv_name },
            { InstallOptions },
            hostRebootScheduler,
            child_process,
            logger,
            os
        ]= await Promise.all([
            import("./installer"),
            import("../lib/InstallOptions"),
            import("../lib/hostRebootScheduler"),
            import("child_process"),
            import("logger"),
            import("os")
        ]);

        const debug = logger.debugFactory();

        const config=  {
            pidfile_path,
            srv_name,
            "isQuiet": true,
            "daemon_unix_user": InstallOptions.get().unix_user,
            "daemon_node_path": node_path,
            "daemon_restart_after_crash_delay": 5000,
            "preForkTask": async () => {

                await hostRebootScheduler.rebootIfScheduled();

                while (true) {

                    debug("Checking whether asterisk is fully booted...");

                    const isAsteriskFullyBooted = await new Promise<boolean>(resolve =>
                        child_process.exec(`${build_ast_cmdline()} -rx "core waitfullybooted"`)
                            .once("error", () => resolve(false))
                            .once("close", code => (code === 0) ? resolve(true) : resolve(false))
                    );

                    if (isAsteriskFullyBooted) {

                        break;

                    }

                    debug("... asterisk is yet running ...");

                    await new Promise(resolve => setTimeout(resolve, 10000));

                }

                debug("...Asterisk is fully booted!");

            }
        };

        if( os.userInfo().username === InstallOptions.get().unix_user ){

            config.daemon_restart_after_crash_delay= -1;

            delete config.preForkTask;

        }else{

            scriptLib.exit_if_not_root();

        }

        return config;

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

                            scriptLib.execSync([
                                "mv",
                                logfile_path,
                                path.join(path.dirname(logfile_path), "previous_crash.log")
                            ].join(" "));

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


