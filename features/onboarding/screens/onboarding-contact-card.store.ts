import { create } from "zustand"
import { formatRandomUsername } from "@/features/onboarding/utils/format-random-user-name"

type IOnboardingContactCardStore = {
  name: string
  username: string
  nameValidationError: string
  avatar: string
  isAvatarUploading: boolean
  actions: {
    setName: (name: string) => void
    setUsername: (username: string) => void
    setNameValidationError: (nameValidationError: string) => void
    setAvatar: (avatar: string) => void
    setIsAvatarUploading: (isUploading: boolean) => void
    reset: () => void
  }
}

export const useOnboardingContactCardStore =
  create<IOnboardingContactCardStore>((set) => ({
    name: "",
    username: "",
    nameValidationError: "",
    avatar: "",
    isAvatarUploading: false,
    actions: {
      setName: (name: string) =>
        set((state) => ({
          name,
          // For now, we're generating the username from the name
          username: formatRandomUsername({ displayName: name }),
        })),
      setUsername: (username: string) => set({ username }),
      setNameValidationError: (nameValidationError: string) =>
        set({ nameValidationError }),
      setAvatar: (avatar: string) => set({ avatar }),
      setIsAvatarUploading: (isAvatarUploading: boolean) =>
        set({ isAvatarUploading }),
      reset: () =>
        set({
          name: "",
          username: "",
          nameValidationError: "",
          avatar: "",
          isAvatarUploading: false,
        }),
    },
  }))
