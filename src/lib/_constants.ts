import { join as pathJoin } from "path";
const config = require("../../config.json");

export const serviceName = config["service-name"];

export const user: string | null= config["user"];

export const group: string | null= config["group"];

export namespace paths {

    export namespace dirs {

        export const project = pathJoin(__dirname, "..", "..");

        export const persist = pathJoin(project, ".node-persist");

        export const asterisk = config["paths"]["asterisk"];

    }

    export namespace files {

        export const systemdServiceFile = pathJoin(config["paths"]["systemd"], `${serviceName}.service`);

        export const udevRules = pathJoin(config["paths"]["udev"], `99-${serviceName}.rules`);

    }

}

export const tty0ttyPairCount: number = config["tty0tty-pair-count"];

export const disableSmsDialplan: boolean= config["disable-sms-dialplan"];
