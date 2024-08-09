import {
  open,
  OPSQLiteConnection,
  QueryResult,
  Transaction,
} from "@op-engineering/op-sqlite";
import logger from "@utils/logger";
import { v4 as uuidv4 } from "uuid";

// Inspired from https://github.com/margelo/react-native-quick-sqlite/blob/be9235eef7d892ed46177f4d4031cc1a9af723ad/src/index.ts#L348

const databasesConnections: {
  [id: string]: {
    connection: OPSQLiteConnection;
    options: { name: string; location?: string };
  };
} = {};

export const dropConverseDbConnections = () => {
  Object.values(databasesConnections).forEach((db) => {
    try {
      db.connection.close();
      logger.debug(`Closed db ${db.options.name}`);
    } catch (e) {
      if (`${e}`.includes("DB is not open")) {
        logger.warn(
          `Could not close ${db.options.name} as it's already closed.`
        );
      } else {
        throw e;
      }
    }
  });
};

export const reconnectConverseDbConnections = () => {
  Object.keys(databasesConnections).forEach((dbId) => {
    const options = databasesConnections[dbId].options;
    const previousConnection = databasesConnections[dbId].connection;
    // Make sure we killed the previous one
    // N.B.: it should already be the case thanks to dropConverseDbConnections but
    // if we leave and come back to the app very fast we could get into a weird state
    try {
      previousConnection.close();
      logger.warn(
        `Managed to close ${options.name} but it should already be closed`
      );
    } catch (e) {
      if (`${e}`.includes("DB is not open")) {
        // Do nothing as this is the normal state
      } else {
        throw e;
      }
    }
    const newDb = open({
      name: options.name,
      location: options.location,
    });
    databasesConnections[dbId].connection = newDb;
  });
};

export const typeORMDriver = {
  openDatabase: (
    options: {
      name: string;
      location?: string;
    },
    ok: (db: any) => void,
    fail: (msg: string) => void
  ): any => {
    try {
      const dbId = uuidv4();
      const db = open({
        name: options.name,
        location: options.location,
      });
      databasesConnections[dbId] = {
        connection: db,
        options,
      };

      const connection = {
        executeSql: async (
          sql: string,
          params: any[] | undefined,
          ok: (res: QueryResult) => void,
          fail: (msg: string) => void
        ) => {
          try {
            const response = await databasesConnections[
              dbId
            ].connection.executeAsync(sql, params);
            ok(response);
          } catch (e: any) {
            fail(e);
          }
        },
        transaction: (
          fn: (tx: Transaction) => Promise<void>
        ): Promise<void> => {
          return databasesConnections[dbId].connection.transaction(fn);
        },
        close: (ok: any, fail: any) => {
          try {
            databasesConnections[dbId].connection.close();
            delete databasesConnections[dbId];
            ok();
          } catch (e) {
            fail(e);
          }
        },
        attach: (
          dbNameToAttach: string,
          alias: string,
          location: string | undefined,
          callback: () => void
        ) => {
          databasesConnections[dbId].connection.attach(
            dbNameToAttach,
            alias,
            location
          );

          callback();
        },
        detach: (alias: any, callback: () => void) => {
          databasesConnections[dbId].connection.detach(alias);

          callback();
        },
      };

      ok(connection);

      return connection;
    } catch (e: any) {
      fail(e.toString());
    }
  },
};
