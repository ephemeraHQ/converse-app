import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React, { FC, PropsWithChildren } from "react";

import { queryClient } from "./queryClient";
import { mmkvStoragePersister } from "../utils/mmkv";

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
