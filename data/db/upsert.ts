import { Platform } from "react-native";
import semver from "semver";
import { DataSource, ObjectLiteral, Repository } from "typeorm/browser";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

// @todo => check with Expo 50 embedded version of Sqlite?

// We support SQLite from version 3.8.10.2 (embedded in Android 6.0 - SDK 23)
const UPSERT_SUPPORTED_FROM = "3.24.0";

export let supportsUpsert = false;

export const checkUpsertSupport = async (dataSource: DataSource) => {
  const sqliteVersion = semver.parse(
    (await dataSource.query(`select sqlite_version() as sqlite_version;`))?.[0]
      ?.sqlite_version
  );
  console.log(`[SQLite] Version ${sqliteVersion}`);
  const versionCompare = sqliteVersion?.compare(UPSERT_SUPPORTED_FROM);
  if (versionCompare === -1) {
    console.log("Database does not support upsert");
    supportsUpsert = false;
  } else {
    supportsUpsert = true;
  }
};

export const upsertRepository = async <T extends ObjectLiteral>(
  repository: Repository<T>,
  entityOrEntities: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[],
  conflictPathsOrOptions: string[],
  returning = true
): Promise<any> => {
  if (Platform.OS === "web") return;
  if (supportsUpsert) {
    // This is basically the "upsert" method from typeorm but with the ability to not
    // return the data from the query which will help in perf because SQLite does not have
    // a "returning" parameter i.e. the ORM does queries right after to get back the data
    const metadata = repository.metadata;
    const conflictColumns = metadata.mapPropertyPathsToColumns(
      conflictPathsOrOptions
    );
    let entities: QueryDeepPartialEntity<T>[];

    if (!Array.isArray(entityOrEntities)) {
      entities = [entityOrEntities];
    } else {
      entities = entityOrEntities;
    }

    const overwriteColumns = metadata.columns.filter(
      (col) =>
        !conflictColumns.includes(col) &&
        entities.some(
          (entity) => typeof col.getEntityValue(entity) !== "undefined"
        )
    );

    const queryBuilder = repository.createQueryBuilder();
    // This is the customized part compared to default typeorm feature
    if (!returning) {
      queryBuilder.expressionMap.updateEntity = false;
    }

    const result = await queryBuilder
      .insert()
      .values(entities)
      .orUpdate(
        [...conflictColumns, ...overwriteColumns].map(
          (col) => col.databaseName
        ),
        conflictColumns.map((col) => col.databaseName)
      )
      .execute();
    return result;
  } else {
    const entities = Array.isArray(entityOrEntities)
      ? entityOrEntities
      : [entityOrEntities];
    for (const entity of entities) {
      try {
        await repository.insert(entity);
      } catch (e: any) {
        const errorMessage = `${e}`;
        if (
          !errorMessage.includes("QueryFailedError: UNIQUE constraint failed")
        ) {
          throw e;
        }
        const criteria: any = {};
        conflictPathsOrOptions.forEach((path) => {
          criteria[path] = (entity as any)[path];
        });
        await repository.update(criteria, entity);
      }
    }
  }
};
