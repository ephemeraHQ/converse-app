import { CurrentSender } from "@/features/multi-inbox/multi-inbox-client.types";
import { zustandMMKVStorage } from "@/utils/storage/zustand-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  useMultiInboxClientStore,
  AccountStoreDataType,
  AccountStoreType,
} from "../multi-inbox/multi-inbox.store";

type IAccountStoreState = {
  currentSender: CurrentSender | undefined;
};

export type IAccountStore = IAccountStoreState & {
  actions: {
    setCurrentSender: (sender: CurrentSender | undefined) => void;
  };
};

export const useAccountStore = create<IAccountStore>()(
  persist(
    (set, get) => ({
      currentSender: undefined,
      actions: {
        setCurrentSender: (sender) => set({ currentSender: sender }),
      },
    }),
    {
      name: "account-store",
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({
        currentSender: state.currentSender,
      }),
    }
  )
);

export const getAccountStore = (inboxId: string) => {
  if (!inboxId) {
    throw new Error("No inboxId provided");
  }

  if (inboxId in storesByAccount) {
    return storesByAccount[inboxId];
  }
  throw new Error(`No account store found for ${inboxId}`);
};

export const getAccountsList = () =>
  useMultiInboxClientStore
    .getState()
    .senders.map((sender) => sender.ethereumAddress);
/**
 * @deprecated We should index by ID instead of ethereum address
 */

export const useAccountsList = () => {
  const senders = useMultiInboxClientStore((state) => state.senders);
  return senders
    .filter((sender) => Boolean(sender.ethereumAddress))
    .map((sender) => sender.ethereumAddress);
};

export const useCurrentAccount = () => {
  const currentSender = useCurrentSender();
  return currentSender?.ethereumAddress;
};

export const getSafeCurrentSender = (): CurrentSender => {
  const currentSender = useMultiInboxClientStore.getState().currentSender;
  if (!currentSender) {
    throw new Error("No current sender");
  }
  return currentSender;
};
export const useSafeCurrentSender = (): CurrentSender => {
  const currentSender = useCurrentSender();

  if (!currentSender) {
    throw new Error("No current sender");
  }
  return currentSender;
};

export const useCurrentSender: () => CurrentSender | undefined = () => {
  return useMultiInboxClientStore((s) => s.currentSender);
};

export function getCurrentAccountEthAddress() {
  return useMultiInboxClientStore.getState().currentSender?.ethereumAddress;
}
export const currentAccountStoreHook = <T extends keyof AccountStoreDataType>(
  key: T
) => {
  const _useStore = <U>(selector: (state: AccountStoreDataType[T]) => U) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const currentSender = useMultiInboxClientStore((s) => s.currentSender);
    const currentInboxId = currentSender?.inboxId;
    if (!currentInboxId) {
      return {
        getState: () => {
          return {
            [key]: {} as AccountStoreDataType[T],
          };
        },
      };
    }
    const accountStore = getAccountStore(currentInboxId);
    if (!accountStore) {
      return {
        getState: () => {
          return {
            [key]: {} as AccountStoreDataType[T],
          };
        },
      };
    }
    return accountStore[key](selector);
  };

  const use = _useStore as AccountStoreType[T];

  use.getState = () => {
    const currentAccountState = useMultiInboxClientStore.getState();
    const currentInboxId = currentAccountState.currentSender?.inboxId;
    if (!currentInboxId) {
      throw new Error("No current sender");
    }
    const accountStore = getAccountStore(currentInboxId);
    return accountStore[key].getState();
  };

  return use;
};

export function getCurrentSender() {
  return useAccountStore.getState().currentSender;
}
