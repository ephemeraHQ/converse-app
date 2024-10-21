import { useAccountsStore } from "@features/accounts/accounts.store";
import {
  open,
  OPSQLiteConnection,
  QueryResult,
  Transaction,
} from "@op-engineering/op-sqlite";
import logger from "@utils/logger";
import path from "path";
import RNFS from "react-native-fs";
import { v4 as uuidv4 } from "uuid";
// Inspired from https://github.com/margelo/react-native-quick-sqlite/blob/be9235eef7d892ed46177f4d4031cc1a9af723ad/src/index.ts#L348

const databasesConnections: {
  [id: string]: {
    connection: OPSQLiteConnection;
    options: {
      name: string;
      location?: string;
      encryptionKey: string;
      encryptionSalt: string;
    };
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
      encryptionKey: options.encryptionKey,
    });
    newDb.execute(`PRAGMA cipher_plaintext_header_size = 32;`);
    newDb.execute(`PRAGMA cipher_salt = "x'${options.encryptionSalt}'";`);
    logger.debug(`Reopened db ${options.name}`);
    databasesConnections[dbId].connection = newDb;
  });
};

export const typeORMDriver = (
  account: string,
  encryptionKey: string,
  encryptionSalt: string
) => ({
  openDatabase: (
    _options: {
      name: string;
      location?: string;
    },
    ok: (db: any) => void,
    fail: (msg: string) => void
  ): any => {
    let options = { ..._options, encryptionKey, encryptionSalt };
    try {
      const dbId = uuidv4();
      const initialDbPath = options.location
        ? path.join(options.location, options.name)
        : options.name;
      let db = open(options);
      db.execute(`PRAGMA cipher_plaintext_header_size = 32;`);
      db.execute(`PRAGMA cipher_salt = "x'${encryptionSalt}'";`);
      try {
        // Try to execute a query with the encryption key
        db.execute("SELECT name FROM sqlite_master WHERE type='table';");
      } catch (e: any) {
        logger.warn(
          `Converse database ${options.name} seems unencrypted. Encrypting.`
        );
        db.close();
        const encryptionResult = encryptPlaintextConverseDb({
          name: options.name,
          location: options.location,
          encryptionKey,
          encryptionSalt,
        });
        // Update the database id in state
        useAccountsStore
          .getState()
          .setDatabaseId(account, encryptionResult.dbId);
        options = { ...options, name: encryptionResult.dbName };
        db = encryptionResult.db;
        // Delete the old database
        RNFS.unlink(initialDbPath);
        logger.info(
          `Converse database now encrypted! New database: ${encryptionResult.dbName}`
        );
      }
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
});

const encryptPlaintextConverseDb = (options: {
  name: string;
  location?: string;
  encryptionKey: string;
  encryptionSalt: string;
}) => {
  const encryptedDbId = uuidv4();
  const encryptedDbName = `converse-${encryptedDbId}.sqlite`;

  logger.debug(
    `[Encryption 1/7] Opening unencrypted database in plaintext mode`
  );
  const plaintextDb = open({
    name: options.name,
    location: options.location,
    encryptionKey: "",
  });

  logger.debug(
    `[Encryption 2/7] Testing communication with plaintext database`
  );
  plaintextDb.execute(`SELECT name FROM sqlite_master WHERE type='table';`);

  logger.debug(`[Encryption 3/7] Attaching new database using encryption key`);
  plaintextDb.execute(
    `ATTACH DATABASE '${
      options.location
        ? path.join(options.location, encryptedDbName)
        : encryptedDbName
    }' AS encrypted KEY '${options.encryptionKey}';`
  );

  logger.debug(`[Encryption 4/7] Setting PRAGMA for new encrypted db`);
  plaintextDb.execute(`PRAGMA encrypted.cipher_plaintext_header_size = 32;`);
  plaintextDb.execute(
    `PRAGMA encrypted.cipher_salt = "x'${options.encryptionSalt}'";`
  );

  logger.debug(`[Encryption 5/7] Encrypting plaintext data to encrypted db`);
  plaintextDb.execute(`SELECT sqlcipher_export('encrypted');`);

  logger.debug(`[Encryption 6/7] Closing`);
  plaintextDb.detach("encrypted");
  plaintextDb.close();

  logger.debug(`[Encryption 7/7] Returning encrypted database to the app`);
  const encryptedDb = open({
    name: encryptedDbName,
    location: options.location,
    encryptionKey: options.encryptionKey,
  });
  encryptedDb.execute(`PRAGMA cipher_plaintext_header_size = 32;`);
  encryptedDb.execute(`PRAGMA cipher_salt = "x'${options.encryptionSalt}'";`);
  return { dbId: encryptedDbId, dbName: encryptedDbName, db: encryptedDb };
};
