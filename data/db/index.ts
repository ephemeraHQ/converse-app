import { Platform } from "react-native";
import RNFS from "react-native-fs";
import { Repository } from "typeorm/browser";

import config from "../../config";
import { sentryTrackError, sentryTrackMessage } from "../../utils/sentry";
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

export const getRepository = async <T extends keyof RepositoriesForAccount>(
  account: string,
  entity: T
) => {
  if (!account || !entity) {
    sentryTrackMessage("Cannot get repository", { entity, account });
    throw new Error(`Cannot get repository ${entity} for account ${account}`);
  }
  // Blocking method that will return the repository only when it has been
  // init. This means methods that try to interact with the database too
  // early will not fail but just take longer to execute!

  while (!repositories[account]?.[entity]) {
    console.warn(`Database for ${account} not yet initialized`);
    await new Promise((r) => setTimeout(r, 100));
  }
  return repositories[account][entity];
};

export const initDb = async (account: string): Promise<void> => {
  const dataSource = await getDataSource(account);
  if (dataSource.isInitialized) {
    return;
  }
  console.log(`Initializing Database for ${account}`);
  try {
    await dataSource.initialize();
    console.log(`Database initialized for ${account}`);
    await checkUpsertSupport(dataSource);
    // https://phiresky.github.io/blog/2020/sqlite-performance-tuning/
    // await dataSource.query("pragma journal_mode = WAL;");
    // await dataSource.query("pragma synchronous = normal;");
    // await dataSource.query("pragma temp_store = memory;");
    // await dataSource.query("pragma mmap_size = 30000000000;");
    // console.log(`Database optimized for ${account}`);
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
      sentryTrackError(e, { account, message: "Error running migrations" });
      console.log(`Error running migrations - destroying db for ${account}`, e);
      await clearDB(account);
    }
  } catch (e: any) {
    const dbPath = await getDbPath(account);
    const dbPathExists = await RNFS.exists(dbPath);
    sentryTrackError(e, {
      account,
      message: "Did not manage to initialize database",
      dbPath,
      dbPathExists,
    });
    await clearDB(account);
  }
};

export const getDbPath = async (account: string) => {
  if (Platform.OS === "ios") {
    const groupPath = await RNFS.pathForGroup(config.appleAppGroup);
    return `${groupPath}/converse-${account}.sqlite`;
  } else {
    return `/data/data/${config.bundleId}/databases/converse-${account}.sqlite`;
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
  const dbPath = await getDbPath(account);
  const dbExists = await RNFS.exists(dbPath);
  if (!dbExists) {
    console.log(
      `[ClearDB] SQlite file converse-${account}.sqlite does not exist, no need to delete`
    );
  } else {
    console.log(`[ClearDB] Deleting SQlite file converse-${account}.sqlite`);
    await RNFS.unlink(dbPath);
    console.log(`[ClearDB] Deleted SQlite file converse-${account}.sqlite`);
  }

  if (reset) {
    return initDb(account);
  }
}
