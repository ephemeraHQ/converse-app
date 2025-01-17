import { zustandMMKVStorage } from "@utils/mmkv";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ChatStoreType = {
  groupInviteLinks: {
    [topic: string]: string;
  };
  setGroupInviteLink: (topic: string, inviteLink: string) => void;
  deleteGroupInviteLink: (topic: string) => void;
};

export const initChatStore = (account: string) => {
  return create<ChatStoreType>()(
    persist(
      (set) => ({
        groupInviteLinks: {},
        setGroupInviteLink(topic, inviteLink) {
          set((state) => {
            const newGroupInvites = { ...state.groupInviteLinks };
            newGroupInvites[topic] = inviteLink;
            return { groupInviteLinks: newGroupInvites };
          });
        },
        deleteGroupInviteLink(topic) {
          set((state) => {
            const newGroupInvites = { ...state.groupInviteLinks };
            delete newGroupInvites[topic];
            return { groupInviteLinks: newGroupInvites };
          });
        },
      }),
      {
        name: `chat-${account}-store`,
        storage: createJSONStorage(() => zustandMMKVStorage),
        // Only persisting the information we want
        partialize: (state) => {
          return {
            groupInviteLinks: state.groupInviteLinks,
          };
        },
      }
    )
  );
};
