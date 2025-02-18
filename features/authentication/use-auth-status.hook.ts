import {
  AuthStatuses,
  useAccountsStore,
} from "@/features/multi-inbox/multi-inbox.store";

import { useSelect } from "@/data/store/storeHelpers";
import { MultiInboxClientRestorationStates } from "@/features/multi-inbox/multi-inbox-client.types";

export const useAuthStatus = () => {
  const { authStatus, multiInboxClientRestorationState } = useAccountsStore(
    useSelect(["authStatus", "multiInboxClientRestorationState"])
  );

  const isRestored =
    multiInboxClientRestorationState ===
    MultiInboxClientRestorationStates.restored;

  const isRestoring =
    multiInboxClientRestorationState ===
    MultiInboxClientRestorationStates.restoring;

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
