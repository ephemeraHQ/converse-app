import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";
import { TransactionEvent } from "../../utils/transaction";

// Transactions for each account setup in the app

export type Transaction = {
  id: string; // Concatenation of "[networkid]-[reference]"
  transactionType:
    | "transactionReference"
    | "coinbaseRegular"
    | "coinbaseSponsored";
  namespace?: string;
  networkId: string | number;
  reference: string;
  metadata?: object;
  status: "PENDING" | "FAILURE" | "SUCCESS";
  sponsored: boolean; // by converse
  blockExplorerURL?: string;
  events?: TransactionEvent[];
  chainName?: string;
};

export type TransactionsStoreType = {
  transactions: { [id: string]: Transaction };

  setTransactions: (transactions: Transaction[]) => void;
  getTransaction: (id: string) => Transaction;

  getEvents: (id: string) => any[];
  setEvents: (id: string, events: any[]) => void;
};

export const initTransactionsStore = (account: string) => {
  const transactionsStore = create<TransactionsStoreType>()(
    persist(
      (set, get) =>
        ({
          transactions: {},

          setTransactions: (transactions) =>
            set((state) => {
              const updatedTransactions = { ...state.transactions };

              transactions.forEach((transaction) => {
                // Upsert logic
                updatedTransactions[transaction.id] = {
                  ...(updatedTransactions[transaction.id] || {}),
                  ...transaction,
                };
              });

              return { transactions: updatedTransactions };
            }),

          getTransaction: (id: string) => {
            return get().transactions[id];
          },

          getEvents: (id) => {
            const transaction = get().transactions[id];
            return transaction.events ?? "[]";
          },

          setEvents: (id, events) =>
            set((state) => ({
              transactions: {
                ...state.transactions,
                [id]: {
                  ...state.transactions[id],
                  events,
                },
              },
            })),
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
