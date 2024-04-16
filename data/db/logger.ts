import { Logger, QueryRunner } from "typeorm/browser";

import { sentryTrackMessage } from "../../utils/sentry";

export class TypeORMLogger implements Logger {
  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[] | undefined,
    queryRunner?: QueryRunner | undefined
  ) {
    sentryTrackMessage("TYPEORM_QUERY_ERROR", { error, query, parameters });
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[] | undefined,
    queryRunner?: QueryRunner | undefined
  ) {
    // console.log(`⏰ SLOW QUERY ${time}ms: ${query}`, parameters);
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
