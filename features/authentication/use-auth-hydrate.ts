import { useSelect } from "@/data/store/store.utils";
import { useAuthStore } from "@/features/authentication/auth.store";
import {
  ensureUserQueryData,
  fetchUserQueryData,
} from "@/features/authentication/user-query";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { useMultiInboxClientStore } from "@/features/multi-inbox/multi-inbox.store";
import { captureError } from "@/utils/capture-error";
import { usePrivy } from "@privy-io/expo";
import { useEffect } from "react";

export const useAuthHydrate = () => {
  const { multiInboxClientRestorationState } = useMultiInboxClientStore(
    useSelect(["multiInboxClientRestorationState"])
  );

  multiInboxClientRestorationState === "restored";

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
      useAuthStore.getState().actions.setStatus("signedOut");
    }
  }, [privyError]);

  useEffect(() => {
    // Waiting for Privy to hydrate
    if (!isPrivyReady) {
      return;
    }

    // Wait for privy to be ready. It should load the user
    if (!privyUser) {
      useAuthStore.getState().actions.setStatus("signedOut");
      return;
    }

    try {
      const user = await ensureUserQueryData({
        privyUserId: privyUser.id,
        caller: "MultiInboxClient.initialize",
      });

      if (!user) {
        throw new Error("User not found");
      }

      await MultiInboxClient.instance.restorePreviouslyCreatedInboxesForDevice({
        inboxes: user.inboxes, // { inboxId and ethAddress }[]
      });

      useAuthStore.getState().actions.setStatus("signedIn");
    } catch (error) {
      captureError(error);
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
