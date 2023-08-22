import RNFS from "react-native-fs";
import { Repository } from "typeorm/browser";

import { useAccountsStore } from "../store/accountsStore";
import {
  deleteDataSource,
  getDataSource,
  getExistingDataSource,
} from "./datasource";
import { Conversation } from "./entities/conversationEntity";
import { Message } from "./entities/messageEntity";
import { Profile } from "./entities/profileEntity";
import { checkUpsertSupport } from "./upsert";

type RepositoriesForAccount = {
  conversation: Repository<Conversation>;
  message: Repository<Message>;
  profile: Repository<Profile>;
};

const repositories: {
  [account: string]: RepositoriesForAccount;
} = {};

export const getRepository = <T extends keyof RepositoriesForAccount>(
  account: string,
  entity: T
) => {
  return repositories[account][entity];
};

export const getCurrentRepository = <T extends keyof RepositoriesForAccount>(
  entity: T
) => {
  const account = useAccountsStore.getState().currentAccount;
  return repositories[account][entity];
};

export const initDb = async (account: string) => {
  const dataSource = getDataSource(account);
  if (dataSource.isInitialized) {
    return;
  }
  console.log(`Initializing Database for ${account}`);
  try {
    await dataSource.initialize();
    console.log(`Database initialized for ${account}`);
    await checkUpsertSupport(dataSource);
    await dataSource.query("pragma journal_mode = WAL;");
    await dataSource.query("pragma synchronous = normal;");
    await dataSource.query("pragma temp_store = memory;");
    await dataSource.query("pragma mmap_size = 30000000000;");
    console.log(`Database optimized for ${account}`);
    try {
      console.log(`Running migrations for ${account}`);
      const r = await dataSource.runMigrations();
      console.log(`Migrations done for ${account}`, r);
      repositories[account] = {
        conversation: dataSource.getRepository(Conversation),
        message: dataSource.getRepository(Message),
        profile: dataSource.getRepository(Profile),
      };
    } catch (e: any) {
      console.log(`Error running migrations - destroying db for ${account}`, e);
      await clearDB(account);
    }
  } catch (e: any) {
    console.log(`Error initializing Database for ${account}`, e);
  }
};

export async function clearDB(account: string, reset = true) {
  try {
    const dataSource = getExistingDataSource(account);
    if (dataSource) {
      await dataSource.destroy();
      console.log(`[ClearDB] Datasource destroyed - ${account}`);
    } else {
      console.log(`[ClearDB] Not datasource to destroy for ${account}`);
    }
  } catch (e) {
    console.log(`[ClearDB] Couldn't destroy datasource ${account} ${e}`);
  }
  deleteDataSource(account);

  // Now let's delete the database file
  const dbPath = `${RNFS.DocumentDirectoryPath}/SQLite/converse-${account}.sqlite`;
  const dbExists = await RNFS.exists(dbPath);
  if (!dbExists) {
    console.log(
      `[ClearDB] SQlite file converse-${account}.sqlite does not exist, no need to delete`
    );
  } else {
    console.log(`[ClearDB] Deleting SQlite file converse-${account}.sqlite`);
    await RNFS.unlink(dbPath);
  }

  if (reset) {
    return initDb(account);
  }
}
