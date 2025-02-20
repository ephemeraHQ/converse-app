import { useAuthStore } from "@/features/authentication/authentication.store";
import { ensureCurrentUserQueryData } from "@/features/current-user/curent-user.query";
import { MultiInboxClientRestorationStates } from "@/features/multi-inbox/multi-inbox-client.types";
import { useMultiInboxStore } from "@/features/multi-inbox/multi-inbox.store";
import { usePrivy } from "@privy-io/expo";
import { useEffect } from "react";

export function useHydrateAuth() {
  const { user: privyUser, isReady } = usePrivy();

  // If we don't have a Privy user, it's not good at all
  useEffect(() => {
    if (!privyUser && isReady) {
      useAuthStore.getState().actions.setStatus("signedOut");
    }
  }, [privyUser, isReady]);

  // Hydrate auth based on multi-inbox client restoration state and current sender
  useEffect(() => {
    const unsub = useMultiInboxStore.subscribe(
      (state) =>
        [state.multiInboxClientRestorationState, state.currentSender] as const,
      async ([multiInboxClientRestorationState, currentSender]) => {
        // No sender means user is not logged in
        if (!currentSender) {
          useAuthStore.getState().actions.setStatus("signedOut");
          return;
        }

        // Wait until multi-inbox client is fully restored
        const hasRestoredInMultiClientRestorationState =
          multiInboxClientRestorationState ===
          MultiInboxClientRestorationStates.restored;

        if (!hasRestoredInMultiClientRestorationState) {
          return;
        }

        // Check if there was an error during restoration
        const hasErrorInMultiClientRestorationState =
          typeof multiInboxClientRestorationState === "object" &&
          "error" in multiInboxClientRestorationState;

        if (hasErrorInMultiClientRestorationState) {
          useAuthStore.getState().actions.setStatus("signedOut");
          return;
        }

        try {
          // Verify user exists in our backend before signing in
          const user = await ensureCurrentUserQueryData();

          if (!user) {
            useAuthStore.getState().actions.setStatus("onboarding");
            return;
          }
        } catch {
          // If we can't fetch user data, send to onboarding
          useAuthStore.getState().actions.setStatus("onboarding");
          return;
        }

        useAuthStore.getState().actions.setStatus("signedIn");
      },
      {
        fireImmediately: true,
      }
    );

    return () => unsub();
  }, []);
}
