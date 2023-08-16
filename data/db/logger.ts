import { Logger, QueryRunner } from "typeorm/browser";

import { sentryTrackMessage } from "../../utils/sentry";
import { supportsUpsert } from "./upsert";

export class TypeORMLogger implements Logger {
  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[] | undefined,
    queryRunner?: QueryRunner | undefined
  ) {
    if (
      !supportsUpsert &&
      error.toString().includes("UNIQUE constraint failed")
    ) {
      // For older devices, we use a try catch for upserts
      // let's not pollute sentry with those
      return;
    }
    console.log("TYPEORM_QUERY_ERROR", { error, query, parameters });
    sentryTrackMessage("TYPEORM_QUERY_ERROR", { error, query, parameters });
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[] | undefined,
    queryRunner?: QueryRunner | undefined
  ) {
    console.log(`⏰ SLOW QUERY ${time}ms: ${query}`, parameters);
  }
  logMigration(message: string, queryRunner?: QueryRunner | undefined) {
    // console.log(message);
  }
  logQuery(
    query: string,
    parameters?: any[] | undefined,
    queryRunner?: QueryRunner | undefined
  ) {
    // console.log(query);
  }
  log(
    level: "log" | "info" | "warn",
    message: any,
    queryRunner?: QueryRunner | undefined
  ) {
    // console.log(message);
  }
  logSchemaBuild(message: string, queryRunner?: QueryRunner | undefined) {
    // console.log(message);
  }
}
