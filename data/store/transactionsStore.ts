import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";

// Transactions for each account setup in the app

type Transaction = {
  id: string; // Concatenation of "[networkid]-[reference]"
  contentType: "transactionReference" | "coinbaseRegular" | "coinbaseSponsored";
  createdAt: number;
  updatedAt: number;
  namespace?: string;
  networkId: string;
  reference: string;
  metadata?: string;
  status: "PENDING" | "FAILURE" | "SUCCESS";
  sponsored: boolean; // by converse
  blockExplorerURL?: string;
  events?: string;
};

type TransactionsStoreType = {
  transactions: { [id: string]: Transaction };
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
};

export const initTransactionsStore = (account: string) => {
  const transactionsStore = create<TransactionsStoreType>()(
    persist(
      (set) => ({
        transactions: {},

        addTransaction: (transaction) =>
          set((state) => ({
            transactions: {
              ...state.transactions,
              [transaction.id]: transaction,
            },
          })),

        updateTransaction: (id, updates) =>
          set((state) => ({
            transactions: {
              ...state.transactions,
              [id]: { ...state.transactions[id], ...updates },
            },
          })),
      }),
      {
        name: `store-${account}-transactions`, // Account-based storage so each account can have its own transactions
        storage: createJSONStorage(() => zustandMMKVStorage),
        version: 1,
      }
    )
  );
  return transactionsStore;
};
