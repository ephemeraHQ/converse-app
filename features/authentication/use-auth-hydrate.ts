import { useSelect } from "@/data/store/storeHelpers";
import { useAuthStore } from "@/features/authentication/auth.store";
import { fetchUserQueryData } from "@/features/authentication/user-query";
import { useAccountsStore } from "@/features/multi-inbox/multi-inbox.store";
import { captureError } from "@/utils/capture-error";
import { usePrivy } from "@privy-io/expo";
import { useEffect } from "react";

export const useAuthHydrate = () => {
  const { multiInboxClientRestorationState } = useAccountsStore(
    useSelect(["multiInboxClientRestorationState"])
  );

  // const authStatus = useAuthStore((state) => state.status);

  // const isRestored = multiInboxClientRestorationState === "restored";

  // const isRestoring =
  //   multiInboxClientRestorationState === "restoring" || authStatus === "idle";

  const {
    user: privyUser,
    isReady: isPrivyReady,
    error: privyError,
  } = usePrivy();

  useEffect(() => {
    if (privyError) {
      captureError(privyError);
    }
  }, [privyError]);

  useEffect(() => {
    // Waiting for Privy to hydrate
    if (!isPrivyReady) {
      return;
    }

    // Wait for privy to be ready.
    // It should load the user
    if (privyUser) {
      // Fetch we have the user query data
      // Ensure we have all the XMTP clients for the user
      // Also refetch the user query data to update it.
      fetchUserQueryData({
        privyId: privyUser.id,
        caller: "useAuthStatus",
      }).then((user) => {
        if (user) {
          useAuthStore.getState().actions.setStatus("signedIn");
        } else {
          useAuthStore.getState().actions.setStatus("signedOut");
        }
      });
    } else {
      // User is not signed in
      useAuthStore.getState().actions.setStatus("signedOut");
    }
  }, [privyUser, isPrivyReady]);

  // const hasNotAuthenticated =
  //   [
  //     AuthStatuses.signedOut,
  //     AuthStatuses.signingIn,
  //     AuthStatuses.signingUp,
  //     AuthStatuses.undetermined,
  //   ].includes(authStatus) || isRestoring;

  // const isSignedOut = hasNotAuthenticated;
  // const isSignedIn = isRestored && authStatus === AuthStatuses.signedIn;

  // return {
  //   isRestoring,
  //   // , isSignedIn, isSignedOut
  // };
};
