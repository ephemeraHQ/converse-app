import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";

// Recommended profiles for each account

type RecommendationTag = {
  text: string;
  image: string;
};

export type RecommendationData = {
  tags: RecommendationTag[];
  ens?: string;
  lensHandles: string[];
  farcasterUsernames: string[];
};

export type Frens = { [address: string]: RecommendationData };

export type RecommendationsStoreType = {
  loading: boolean;
  updatedAt: number;
  frens: Frens;
  setLoadingRecommendations: () => void;
  setRecommendations: (frens: Frens, updatedAt: number) => void;
  resetRecommendations: () => void;
};

export const initRecommendationsStore = (account: string) => {
  const recommendationsStore = create<RecommendationsStoreType>()(
    persist(
      (set) => ({
        loading: false,
        updatedAt: 0,
        frens: {},
        setLoadingRecommendations: () =>
          set(() => ({
            loading: true,
          })),
        setRecommendations: (frens, updatedAt) =>
          set(() => ({
            frens,
            updatedAt,
            loading: false,
          })),
        resetRecommendations: () =>
          set(() => ({
            loading: false,
            updatedAt: 0,
            frens: {},
          })),
      }),
      {
        name: `store-${account}-recommendations`, // Account-based storage so each account can have its own recos
        storage: createJSONStorage(() => zustandMMKVStorage),
        // Only persisting the information we want
        partialize: (state) => ({
          updatedAt: state.updatedAt,
          frens: state.frens,
        }),
      }
    )
  );
  return recommendationsStore;
};
