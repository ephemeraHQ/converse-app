import { useSelect } from "@/data/store/storeHelpers";
import { useAuthStore } from "@/features/authentication/auth.store";
import { ensureUserQueryData } from "@/features/authentication/user-query";
import {
  AuthStatuses,
  useAccountsStore,
} from "@/features/multi-inbox/multi-inbox.store";
import { useEffect } from "react";

export const useAuthStatus = () => {
  const { multiInboxClientRestorationState } = useAccountsStore(
    useSelect(["multiInboxClientRestorationState"])
  );

  const authStatus = useAuthStore((state) => state.status);

  const isRestored = multiInboxClientRestorationState === "restored";

  const isRestoring =
    multiInboxClientRestorationState === "restoring" || authStatus === "idle";

  // useEffect(() => {
  //   ensureUserQueryData({
  //     privy
  //     caller: "useAuthStatus",
  //   });
  // }, [ensureUserQueryData]);

  const hasNotAuthenticated =
    [
      AuthStatuses.signedOut,
      AuthStatuses.signingIn,
      AuthStatuses.signingUp,
      AuthStatuses.undetermined,
    ].includes(authStatus) || isRestoring;

  const isSignedOut = hasNotAuthenticated;
  const isSignedIn = isRestored && authStatus === AuthStatuses.signedIn;

  return { isRestoring, isSignedIn, isSignedOut };
};
