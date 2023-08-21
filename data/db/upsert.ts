import semver from "semver";
import { DataSource, ObjectLiteral, Repository } from "typeorm/browser";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

// TODO => all of this should not be needed anymore since we use react-native-quick-sqlite
// that embeds a version of sqlite and does not depend on the version from the OS

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
  conflictPathsOrOptions: string[]
): Promise<any> => {
  if (supportsUpsert) {
    const upsertResult = await repository.upsert(
      entityOrEntities,
      conflictPathsOrOptions
    );
    return upsertResult;
  } else {
    const entities = Array.isArray(entityOrEntities)
      ? entityOrEntities
      : [entityOrEntities];
    for (const entity of entities) {
      try {
        const insertResult = await repository.insert(entity);
        return insertResult;
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
