import { ObjectLiteral, Repository } from "typeorm/browser";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

// We use an embedded SQLite v3.45.1 from op-sqlite

export const maxVariableCount = 32700;

export const upsertRepository = async <T extends ObjectLiteral>(
  repository: Repository<T>,
  entityOrEntities: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[],
  conflictPathsOrOptions: string[],
  returning = true
): Promise<any> => {
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
      [...conflictColumns, ...overwriteColumns].map((col) => col.databaseName),
      conflictColumns.map((col) => col.databaseName)
    )
    .execute();
  return result;
};
