import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React, { FC, PropsWithChildren } from "react";

import { mmkvStoragePersister } from "../utils/mmkv";
import { queryClient } from "./queryClient";

export const QueryClientProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: mmkvStoragePersister,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
