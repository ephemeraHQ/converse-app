import {
  experimental_createPersister,
  type AsyncStorage,
  type PersistedQuery,
} from "@tanstack/query-persist-client-core";
import { DEFAULT_GC_TIME } from "../queryClient.constants";
import mmkv from "@/utils/mmkv";
import logger from "@/utils/logger";
import { QueryState } from "@tanstack/query-core";

export type GenericPersistedQuery<T, E = Error> = Omit<
  PersistedQuery,
  "state"
> & {
  state: QueryState<T | null, E>;
};

type CreateStorageArgs = {
  name: string;
};

const createStorage = ({ name }: CreateStorageArgs): AsyncStorage => {
  return {
    getItem: async (key) => {
      logger.debug(`[Persistence] getItem - ${name} - ${key}`);
      const value = mmkv.getString(key);
      if (!value) {
        return null;
      }

      return value;
    },
    setItem: async (key, value) => {
      logger.debug(`[Persistence] setItem - ${name} - ${key}`);
      return mmkv.set(key, value);
    },
    removeItem: async (key) => {
      logger.debug(`[Persistence] removeItem - ${name} - ${key}`);
      return mmkv.delete(key);
    },
  };
};

/**
 * @param T - The type of the query data
 */
type CreatePersisterArgs<T> = {
  name: string;
  deserialize?: (cached: string) => GenericPersistedQuery<T>;
};

export const createPersister = <T = any>({
  name,
  deserialize,
}: CreatePersisterArgs<T>) => {
  return experimental_createPersister({
    storage: createStorage({ name }),
    maxAge: DEFAULT_GC_TIME,
    deserialize,
  });
};
