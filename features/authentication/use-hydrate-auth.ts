import { useAuthStore } from "@/features/authentication/authentication.store";
import { ensureCurrentUserQueryData } from "@/features/current-user/curent-user.query";
import { MultiInboxClientRestorationStates } from "@/features/multi-inbox/multi-inbox-client.types";
import { useAccountsStore } from "@/features/multi-inbox/multi-inbox.store";
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
    const unsub = useAccountsStore.subscribe(
      (state) =>
        [state.multiInboxClientRestorationState, state.currentSender] as const,
      async ([multiInboxClientRestorationState, currentSender]) => {
        if (!currentSender) {
          useAuthStore.getState().actions.setStatus("signedOut");
          return;
        }

        const hasErrorInMultiClientRestorationState =
          typeof multiInboxClientRestorationState === "object" &&
          "error" in multiInboxClientRestorationState;

        if (hasErrorInMultiClientRestorationState) {
          useAuthStore.getState().actions.setStatus("signedOut");
          return;
        }

        const hasRestoredInMultiClientRestorationState =
          multiInboxClientRestorationState ===
          MultiInboxClientRestorationStates.restored;

        if (hasRestoredInMultiClientRestorationState) {
          // Verify user profile exists before signing in
          try {
            // TODO: Check current user and maybe do upsert since having user isn't a "must"?
            const user = await ensureCurrentUserQueryData();

            if (!user) {
              useAuthStore.getState().actions.setStatus("onboarding");
              return;
            }
          } catch {
            useAuthStore.getState().actions.setStatus("onboarding");
            return;
          }

          // We're good to go!
          useAuthStore.getState().actions.setStatus("signedIn");
        }
      },
      {
        fireImmediately: true,
      }
    );

    return () => unsub();
  }, []);
}
