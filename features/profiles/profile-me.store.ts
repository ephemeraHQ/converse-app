import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { createStore, useStore } from "zustand"
import { createJSONStorage, persist, subscribeWithSelector } from "zustand/middleware"
import { zustandMMKVStorage } from "@/utils/zustand/zustand"

type IProfileMeStoreState = {
  editMode: boolean
  nameTextValue: string | undefined
  usernameTextValue: string | undefined
  descriptionTextValue: string | undefined
  avatarUri?: string
  isAvatarUploading: boolean
}

type IProfileMeStoreActions = {
  setEditMode: (editMode: boolean) => void
  setNameTextValue: (nameTextValue: string) => void
  setUsernameTextValue: (usernameTextValue: string) => void
  setDescriptionTextValue: (descriptionTextValue: string) => void
  setAvatarUri: (avatarUri?: string) => void
  setIsAvatarUploading: (isUploading: boolean) => void
  reset: () => void
}

export type IProfileMeStore = IProfileMeStoreState & {
  actions: IProfileMeStoreActions
}

const DEFAULT_STATE: IProfileMeStoreState = {
  editMode: false,
  nameTextValue: "",
  usernameTextValue: "",
  descriptionTextValue: "",
  avatarUri: undefined,
  isAvatarUploading: false,
}

function getProfileMeStorageKey(inboxId: IXmtpInboxId) {
  return `profile-me-${inboxId}`
}

function createProfileMeStore(inboxId: IXmtpInboxId) {
  const storageKey = getProfileMeStorageKey(inboxId)

  return createStore<IProfileMeStore>()(
    subscribeWithSelector(
      persist(
        (set, get, store) => ({
          ...DEFAULT_STATE,
          actions: {
            setEditMode: (editMode) => set({ editMode }),
            setNameTextValue: (nameTextValue) => set({ nameTextValue }),
            setUsernameTextValue: (usernameTextValue) => set({ usernameTextValue }),
            setDescriptionTextValue: (descriptionTextValue) => set({ descriptionTextValue }),
            setAvatarUri: (avatarUri) => set({ avatarUri }),
            setIsAvatarUploading: (isAvatarUploading) => set({ isAvatarUploading }),
            reset: () => {
              set(DEFAULT_STATE)
              // Clear persisted data
              zustandMMKVStorage.removeItem(storageKey)
            },
          },
        }),
        {
          storage: createJSONStorage(() => zustandMMKVStorage),
          name: storageKey,
          partialize: (state) => ({
            editMode: state.editMode,
            nameTextValue: state.nameTextValue,
            usernameTextValue: state.usernameTextValue,
            descriptionTextValue: state.descriptionTextValue,
            avatarUri: state.avatarUri,
            isAvatarUploading: state.isAvatarUploading,
          }),
        },
      ),
    ),
  )
}

// Store instances cache
const stores: Record<IXmtpInboxId, ReturnType<typeof createProfileMeStore>> = {}

/**
 * Creates and manages a profile me store for a specific inbox
 * @param inboxId - The ID of the inbox to create/retrieve the store for
 * @returns A Zustand store instance for the specified inbox
 */
export function useProfileMeStore(inboxId: IXmtpInboxId) {
  if (!stores[inboxId]) {
    stores[inboxId] = createProfileMeStore(inboxId)
  }
  return stores[inboxId]
}

/**
 * Hook to subscribe to profile me store state
 * @param inboxId - The ID of the inbox store to subscribe to
 * @param selector - Selector function to pick specific state
 * @returns Selected state from the store
 */
export function useProfileMeStoreValue<T>(
  inboxId: IXmtpInboxId,
  selector: (state: IProfileMeStore) => T,
): T {
  const store = useProfileMeStore(inboxId)
  return useStore(store, selector)
}
