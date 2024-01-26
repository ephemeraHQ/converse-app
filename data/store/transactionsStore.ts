import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";
import { TransactionEvent } from "../../utils/transaction";

// Transactions for each account setup in the app

export type Transaction = {
  id: string; // Concatenation of "[networkid]-[reference]"
  transactionType?:
    | "transactionReference"
    | "coinbaseRegular"
    | "coinbaseSponsored";
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
  setTransactions: (transactions: { [id: string]: Transaction }) => void;
  getTransaction: (id: string) => Transaction;
  getEvents: (id: string) => any[];
};

export const initTransactionsStore = (account: string) => {
  const transactionsStore = create<TransactionsStoreType>()(
    persist(
      (set, get) =>
        ({
          transactions: {},

          setTransactions: (newTransactions: { [id: string]: Transaction }) => {
            set((state) => ({
              transactions: { ...state.transactions, ...newTransactions },
            }));
          },

          getTransaction: (id: string) => {
            return get().transactions[id];
          },

          getEvents: (id) => {
            const transaction = get().transactions[id];
            return transaction.events ?? [];
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
