import { AppState, Platform } from "react-native";
import RNFS from "react-native-fs";
import { Repository } from "typeorm/browser";

import {
  deleteDataSource,
  getDataSource,
  getExistingDataSource,
} from "./datasource";
import { Conversation } from "./entities/conversationEntity";
import { Message } from "./entities/messageEntity";
import { Profile } from "./entities/profileEntity";
import config from "../../config";
import { sentryTrackError, sentryTrackMessage } from "../../utils/sentry";
import { useAccountsStore } from "../store/accountsStore";

const env = config.xmtpEnv as "dev" | "production" | "local";

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

  // We also use the same mechanism to postpone writing to
  // database if the app is in background

  while (
    !repositories[account]?.[entity] ||
    AppState.currentState.match(/inactive|background/)
  ) {
    console.log(`Database for ${account} not yet initialized`);
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
    // https://phiresky.github.io/blog/2020/sqlite-performance-tuning/
    await Promise.all([
      dataSource.query(
        "PRAGMA journal_mode=WAL;PRAGMA synchronous=normal;PRAGMA temp_store=memory;"
      ),
      dataSource.query("PRAGMA synchronous=normal;"),
      dataSource.query("PRAGMA temp_store=memory;"),
      dataSource.query("PRAGMA mmap_size=30000000000;"),
    ]);
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
      sentryTrackError(e, { account, message: "Error running migrations" });
      console.log(`Error running migrations - destroying db for ${account}`, e);
      await resetConverseDb(account);
    }
  } catch (e: any) {
    const dbPath = await getConverseDbPath(account);
    const dbPathExists = await RNFS.exists(dbPath);
    sentryTrackError(e, {
      account,
      message: "Did not manage to initialize database",
      dbPath,
      dbPathExists,
    });
    await resetConverseDb(account);
  }
};

export const getDbFileName = (account: string) => {
  const dbId = useAccountsStore.getState().databaseId[account];
  if (!dbId) {
    // By default we use the account name, but for next logout
    // we'll use the mapping
    return `converse-${account}.sqlite`;
  }
  return `converse-${dbId}.sqlite`;
};

export const getDbDirectory = async () => {
  if (Platform.OS === "ios") {
    const groupPath = await RNFS.pathForGroup(config.appleAppGroup);
    return groupPath;
  } else {
    return `/data/data/${config.bundleId}/databases`;
  }
};

export const getConverseDbPath = async (account: string) => {
  const filename = getDbFileName(account);
  const directory = await getDbDirectory();
  return `${directory}/${filename}`;
};

export const clearConverseDb = async (account: string) => {
  const dbPath = await getConverseDbPath(account);
  let dbExists = await RNFS.exists(dbPath);
  console.log("[ClearDB]", { dbPath, dbExists });
  try {
    const dataSource = getExistingDataSource(account);
    if (dataSource) {
      await dataSource.destroy();
      console.log(`[ClearDB] Datasource destroyed - ${account}`);
    } else {
      console.log(`[ClearDB] Not datasource to destroy for ${account}`);
    }
  } catch (e) {
    sentryTrackError(e, { message: "Couldn't destroy datasource", account });
    console.log(`[ClearDB] Couldn't destroy datasource ${account} ${e}`);
  }
  deleteDataSource(account);
  delete repositories[account];

  // Now let's delete the database file
  dbExists = await RNFS.exists(dbPath);
  if (!dbExists) {
    console.log(
      `[ClearDB] SQlite file ${dbPath} does not exist, no need to delete`
    );
  } else {
    if (env !== "dev") {
      // Won't clear db in dev mode so Testflight users still have access
      console.log(`[ClearDB] Deleting SQlite file ${dbPath}`);
      await RNFS.unlink(dbPath);

      console.log(`[ClearDB] Deleted SQlite file ${dbPath}`);
    }
  }
};

export async function resetConverseDb(account: string) {
  await clearConverseDb(account);
  // Change filename & path to avoid locked state due to
  // filesystem locking the previous file path
  useAccountsStore.getState().resetDatabaseId(account);
  return initDb(account);
}
