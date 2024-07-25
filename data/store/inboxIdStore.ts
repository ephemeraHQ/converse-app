import { Member } from "@xmtp/react-native-sdk";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";

export type InboxIdStoreType = {
  byAddress: { [address: string]: string };
  byInboxId: { [inboxId: string]: string[] };
  setInboxId: (address: string, inboxId: string) => void;
  removeInboxId: (address: string) => void;
  addAddressToInboxId: (inboxId: string, address: string) => void;
  removeAddressFromInboxId: (inboxId: string, address: string) => void;
  addMembers: (members: Member[]) => void;
};

export const initInboxIdStore = (account: string) => {
  const inboxStore = create<InboxIdStoreType>()(
    persist<InboxIdStoreType>(
      (set) =>
        ({
          byAddress: {},
          byInboxId: {},
          setInboxId: (address, inboxId) =>
            set((state) => {
              const newState = { ...state };
              newState.byAddress[address] = inboxId;
              if (!newState.byInboxId[inboxId]) {
                newState.byInboxId[inboxId] = [];
              }
              newState.byInboxId[inboxId].push(address);
              return newState;
            }),
          removeInboxId: (address) =>
            set((state) => {
              const newState = { ...state };
              const inboxId = newState.byAddress[address];
              if (inboxId) {
                delete newState.byAddress[address];
                newState.byInboxId[inboxId] = newState.byInboxId[
                  inboxId
                ].filter((a) => a !== address);
              }
              return newState;
            }),
          addAddressToInboxId: (inboxId, address) =>
            set((state) => {
              const newState = { ...state };
              if (!newState.byInboxId[inboxId]) {
                newState.byInboxId[inboxId] = [];
              }
              newState.byInboxId[inboxId].push(address);
              newState.byAddress[address] = inboxId;
              return newState;
            }),
          removeAddressFromInboxId: (inboxId, address) =>
            set((state) => {
              const newState = { ...state };
              newState.byInboxId[inboxId] = newState.byInboxId[inboxId].filter(
                (a) => a !== address
              );
              delete newState.byAddress[address];
              return newState;
            }),
          addMembers: (members) =>
            set((state) => {
              if (!members) {
                return state;
              }
              const newState = { ...state };
              members.forEach((member) => {
                const addresses = new Set(
                  newState.byInboxId[member.inboxId] ?? []
                );
                for (const address of member.addresses) {
                  newState.byAddress[address] = member.inboxId;
                  addresses.add(address);
                }
                newState.byInboxId[member.inboxId] = Array.from(addresses);
              });
              return newState;
            }),
        }) as InboxIdStoreType,
      {
        name: `store-${account}-inboxid`, // Account-based storage so each account can have its own inboxId data
        storage: createJSONStorage(() => zustandMMKVStorage),
        version: 2,
      }
    )
  );
  return inboxStore;
};
