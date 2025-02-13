import { DEFAULT_GC_TIME } from "@/queries/queryClient.constants";
import { experimental_createPersister } from "@tanstack/react-query-persist-client";
import { MMKV } from "react-native-mmkv";

export const reactQueryPersister = experimental_createPersister({
  storage: {
    getItem: (key: string) => {
      const stringValue = reactQueryMMKV.getString(key);
      return stringValue || null;
    },
    setItem: (key: string, value: string) => {
      // Deleting before setting to avoid memory leak
      // https://github.com/mrousavy/react-native-mmkv/issues/440
      reactQueryMMKV.delete(key);
      if (value) {
        reactQueryMMKV.set(key, value);
      }
    },
    removeItem: (key: string) => reactQueryMMKV.delete(key),
  },
  maxAge: DEFAULT_GC_TIME,
});

export const reactQueryMMKV = new MMKV({ id: "converse-react-query" });
