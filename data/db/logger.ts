import logger from "@utils/logger";
import { Logger, QueryRunner } from "typeorm/browser";

export class TypeORMLogger implements Logger {
  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[] | undefined,
    queryRunner?: QueryRunner | undefined
  ) {
    logger.error(error, { type: "TYPEORM_QUERY_ERROR", query, parameters });
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[] | undefined,
    queryRunner?: QueryRunner | undefined
  ) {
    // logger.debug(`⏰ SLOW QUERY ${time}ms: ${query}`, parameters);
  }
  logMigration(message: string, queryRunner?: QueryRunner | undefined) {
    // logger.debug(message);
  }
  logQuery(
    query: string,
    parameters?: any[] | undefined,
    queryRunner?: QueryRunner | undefined
  ) {
    // logger.debug(query);
  }
  log(
    level: "log" | "info" | "warn",
    message: any,
    queryRunner?: QueryRunner | undefined
  ) {
    // logger.debug(message);
  }
  logSchemaBuild(message: string, queryRunner?: QueryRunner | undefined) {
    // logger.debug(message);
  }
}
