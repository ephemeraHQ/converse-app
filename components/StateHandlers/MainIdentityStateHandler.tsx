import {
  useAccountsStore,
  useCurrentAccount,
} from "@features/accounts/accounts.store";
import { useEffect } from "react";

import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import { saveUser } from "../../utils/api";

export default function MainIdentityStateHandler() {
  const userAddress = useCurrentAccount();
  const privyAccountId = useAccountsStore((s) => s.privyAccountId);

  useEffect(() => {
    if (userAddress) {
      saveUser(userAddress, privyAccountId[userAddress] as string);
      refreshProfileForAddress(userAddress, userAddress);
    }
  }, [privyAccountId, userAddress]);

  return null;
}
