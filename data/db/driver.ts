import { open, QueryResult, Transaction } from "@op-engineering/op-sqlite";

// Inspired from https://github.com/margelo/react-native-quick-sqlite/blob/be9235eef7d892ed46177f4d4031cc1a9af723ad/src/index.ts#L348

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
      const db = open({
        name: options.name,
        location: options.location,
      });

      const connection = {
        executeSql: async (
          sql: string,
          params: any[] | undefined,
          ok: (res: QueryResult) => void,
          fail: (msg: string) => void
        ) => {
          try {
            const response = await db.executeAsync(sql, params);
            ok(response);
          } catch (e: any) {
            fail(e);
          }
        },
        transaction: (
          fn: (tx: Transaction) => Promise<void>
        ): Promise<void> => {
          return db.transaction(fn);
        },
        close: (ok: any, fail: any) => {
          try {
            db.close();
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
          db.attach(dbNameToAttach, alias, location);

          callback();
        },
        detach: (alias: any, callback: () => void) => {
          db.detach(alias);

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
