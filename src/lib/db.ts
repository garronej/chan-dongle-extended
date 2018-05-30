import { apiDeclaration } from "../chan-dongle-extended-client";
import { Message } from "ts-gsm-modem";
import * as sqliteCustom from "sqlite-custom";
import { db_path } from "../bin/installer";

export let _: sqliteCustom.Api;

/** Must be called and awaited before use */
export async function launch(): Promise<void> {

    sqliteCustom.enableLog();

    _ = await sqliteCustom.connectAndGetApi(
        db_path, "HANDLE STRING ENCODING"
    );

}

/** Debug only */
export async function flush(){

    await _.query([
        "DELETE FROM pin",
        "DELETE FROM message"
    ].join(";\n"));

}

export namespace pin {

    export type AssociatedTo = AssociatedTo.Iccid | AssociatedTo.Imei;

    export namespace AssociatedTo {

        export type Iccid = { iccid: string; };

        export namespace Iccid {

            export function match(associatedTo: AssociatedTo): associatedTo is Iccid {
                return !!(associatedTo as Iccid).iccid;
            }


        }

        export type Imei = { imei: string; };

        export namespace Imei {

            export function match(associatedTo: AssociatedTo): associatedTo is Imei {
                return !Iccid.match(associatedTo);
            }

        }

    }

    export async function save(
        pin: string | undefined,
        associatedTo: AssociatedTo
    ) {

        const sql = (() => {

            if (!!pin) {

                if (AssociatedTo.Iccid.match(associatedTo)) {

                    return _.buildInsertOrUpdateQueries(
                        "pin",
                        {
                            "iccid": associatedTo.iccid,
                            "imei": null,
                            "value": pin
                        },
                        ["iccid"]
                    );

                } else {

                    return _.buildInsertOrUpdateQueries(
                        "pin",
                        {
                            "iccid": null,
                            "imei": associatedTo.imei,
                            "value": pin
                        },
                        ["imei"]
                    );

                }

            } else {

                return [
                    "DELETE FROM pin WHERE",
                    AssociatedTo.Iccid.match(associatedTo) ?
                        `iccid=${associatedTo.iccid}` :
                        `imei=${associatedTo.imei}`
                ].join(" ");

            }

        })();

        return _.query(sql);

    }

    export async function get(
        associatedTo: AssociatedTo
    ): Promise<string | undefined> {

        const res = await _.query([
            "SELECT value FROM pin WHERE",
            AssociatedTo.Iccid.match(associatedTo) ?
                `iccid=${associatedTo.iccid}` :
                `imei=${associatedTo.imei}`
        ].join(" "));

        if (res.length === 0) {
            return undefined;
        } else {

            return res[0]["value"];

        }

    }

}

export namespace messages {

    export async function retrieve(
        params: apiDeclaration.service.getMessages.Params
    ): Promise<apiDeclaration.service.getMessages.Response> {

        const fromDate = params.fromDate ? params.fromDate.getTime() : 0;
        const toDate = params.toDate ? params.toDate.getTime() : Date.now();

        const where_clause = [
            `${_.esc(fromDate)} <= date AND date <= ${_.esc(toDate)}`,
            !!params.imsi ? ` AND imsi= ${_.esc(params.imsi)}` : ""
        ].join("");

        let sql = [
            `SELECT imsi, date, number, text`,
            `FROM message`,
            `WHERE ${where_clause}`,
            `ORDER BY date ASC;`
        ].join("\n");

        let entries: any[];

        if (!!params.flush) {

            sql += "\n" + `DELETE FROM message WHERE ${where_clause}`;

            const res= await _.query(sql);

            entries= res[0];

        }else{

            entries= await _.query(sql);

        }

        for (const entry of entries) {
            entry["date"] = new Date(entry["date"]);
        }

        return entries;

    }

    export async function save(imsi: string, message: Message) {

        const sql = _.buildInsertQuery("message", {
            imsi,
            "date": message.date.getTime(),
            "number": message.number,
            "text": message.text
        }, "THROW ERROR");

        await _.query(sql);

    }

}
