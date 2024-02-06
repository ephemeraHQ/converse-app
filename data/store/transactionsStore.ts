import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";
import {
  TransactionContentType,
  TransactionEvent,
} from "../../utils/transaction";

// Transactions for each account setup in the app

export type Transaction = {
  id: string; // Concatenation of "[networkid]-[reference]"
  transactionType?: TransactionContentType;
  namespace?: string;
  networkId: string | number;
  reference: string;
  metadata?: object;
  status?: "PENDING" | "FAILURE" | "SUCCESS";
  sponsored: boolean; // by converse
  blockExplorerURL?: string;
  events?: TransactionEvent[];
  chainName?: string;
};

export type TransactionsStoreType = {
  transactions: { [id: string]: Transaction };
  saveTransactions: (transactions: { [id: string]: Transaction }) => void;
};

export const initTransactionsStore = (account: string) => {
  const transactionsStore = create<TransactionsStoreType>()(
    persist(
      (set, get) =>
        ({
          transactions: {},

          saveTransactions: (newTransactions: {
            [id: string]: Transaction;
          }) => {
            set((state) => ({
              transactions: { ...state.transactions, ...newTransactions },
            }));
          },
        }) as TransactionsStoreType,
      {
        name: `store-${account}-transactions`, // Account-based storage so each account can have its own transactions
        storage: createJSONStorage(() => zustandMMKVStorage),
        version: 1,
      }
    )
  );
  return transactionsStore;
};
