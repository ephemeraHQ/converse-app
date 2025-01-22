import {
  experimental_createPersister,
  StoragePersisterOptions,
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
  state: QueryState<T, E>;
};

type CreateStorageArgs<T> = {
  name: string;
};

const createStorage = <T>({
  name,
}: CreateStorageArgs<T>): AsyncStorage<GenericPersistedQuery<T>> => {
  return {
    getItem: (key) => {
      logger.debug(`[Persistence DEBUGGING 1111] getItem - ${name} - ${key}`);
      const value = mmkv.getString(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value);
    },
    setItem: (key, value: GenericPersistedQuery<T>) => {
      logger.debug(
        `[Persistence DEBUGGING 1111] setItem - ${name} - ${key} - ${value}`
      );
      return mmkv.set(key, JSON.stringify(value));
    },
    removeItem: (key) => {
      logger.debug(
        `[Persistence DEBUGGING 1111] removeItem - ${name} - ${key}`
      );
      // return mmkv.delete(key);
    },
  };
};

/**
 * @param T - The type of the query data
 */
type CreatePersisterArgs<T> = {
  name: string;
  deserialize: (cached: string) => T;
};

export const createPersister = <T = any>({
  name,
  deserialize,
}: CreatePersisterArgs<T>) => {
  return experimental_createPersister<T>({
    storage: createStorage<T>({ name }),
    maxAge: DEFAULT_GC_TIME,
    deserialize,
  });
};
