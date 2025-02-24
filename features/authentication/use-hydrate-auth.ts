import { usePrivy } from "@privy-io/expo";
import { useEffect } from "react";
import { useAuthStore } from "@/features/authentication/authentication.store";
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store";
import { ensureCurrentUserQueryData } from "@/features/current-user/curent-user.query";
import { getXmtpClient } from "@/features/xmtp/xmtp-client/xmtp-client.service";
import { captureError } from "@/utils/capture-error";

export function useHydrateAuth() {
  const { user: privyUser, isReady } = usePrivy();
  const authStatus = useAuthStore((s) => s.status);

  // If we don't have a Privy user, it's not good at all
  useEffect(() => {
    if (
      !privyUser &&
      isReady &&
      (authStatus === "signedOut" || authStatus === "onboarding")
    ) {
      useAuthStore.getState().actions.setStatus("signedOut");
    }
  }, [privyUser, isReady, authStatus]);

  // Hydrate auth based on XMTP client state and current sender
  useEffect(() => {
    const unsub = useMultiInboxStore.subscribe(
      (state) => state.currentSender,
      async (currentSender) => {
        // No sender means user is not logged in
        if (!currentSender) {
          useAuthStore.getState().actions.setStatus("signedOut");
          return;
        }

        try {
          await getXmtpClient({ ethAddress: currentSender.ethereumAddress });
        } catch (error) {
          captureError(error);
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
          // If we can't get XMTP client or fetch user data, send to onboarding
          useAuthStore.getState().actions.setStatus("onboarding");
          return;
        }

        // We're good to go!
        useAuthStore.getState().actions.setStatus("signedIn");
      },
      {
        fireImmediately: true,
      },
    );

    return () => unsub();
  }, []);
}
