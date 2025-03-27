import { create } from "zustand"
import { createJSONStorage, persist, subscribeWithSelector } from "zustand/middleware"
import { zustandMMKVStorage } from "@/utils/zustand/zustand"

type AppStoreType = {
  isInternetReachable: boolean
  setIsInternetReachable: (reachable: boolean) => void
}

export const useAppStore = create<AppStoreType>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        isInternetReachable: false,
        setIsInternetReachable: (reachable) => set(() => ({ isInternetReachable: reachable })),
      }),
      {
        name: "store-app",
        storage: createJSONStorage(() => zustandMMKVStorage),
        partialize: (state) => ({
          isInternetReachable: state.isInternetReachable,
        }),
      },
    ),
  ),
)
