import {
  MultiInboxClientRestorationState,
  MultiInboxClientRestorationStates,
} from "@/features/multi-inbox/multi-inbox-client.types";
import { StoreApi, UseBoundStore, create } from "zustand";
import { SettingsStoreType } from "../../data/store/settings-store";

export type AccountStoreDataType = {
  settings: SettingsStoreType;
};

export type AccountStoreType = {
  [K in keyof AccountStoreDataType]: UseBoundStore<
    StoreApi<AccountStoreDataType[K]>
  >;
};

type IMultiInboxClientStore = {
  multiInboxClientRestorationState: MultiInboxClientRestorationState;
  actions: {
    setMultiInboxClientRestorationState: (
      state: MultiInboxClientRestorationState
    ) => void;
  };

  // currentSender: CurrentSender | undefined;

  // setCurrentSender: (sender: CurrentSender | undefined) => void;
  // addSender: (sender: CurrentSender) => void;
  // setCurrentAccount: (ethereumAddress: string) => void;
  // senders: CurrentSender[];
  // logoutAllSenders: () => void;
};

// Main accounts store
export const useMultiInboxClientStore = create<IMultiInboxClientStore>()(
  (set, get) => ({
    multiInboxClientRestorationState: MultiInboxClientRestorationStates.idle,

    actions: {
      setMultiInboxClientRestorationState: (
        state: MultiInboxClientRestorationState
      ) => set({ multiInboxClientRestorationState: state }),
    },
    // addSender: (sender: CurrentSender) =>
    //   set((state) => {
    //     if (!storesByAccount[sender.ethereumAddress]) {
    //       initStores(sender.ethereumAddress);
    //     }
    //     const senderExists = state.senders.some(
    //       (existingSender) =>
    //         existingSender.ethereumAddress === sender.ethereumAddress &&
    //         existingSender.inboxId === sender.inboxId
    //     );
    //     if (senderExists) return state;
    //     return { senders: [...state.senders, sender] };
    //   }),
    // senders: [],
    // logoutAllSenders: () => {
    //   set({ senders: [], currentSender: undefined });
    // },
  })
);
