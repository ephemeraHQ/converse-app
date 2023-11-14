import { useEffect } from "react";

import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import {
  useCurrentAccount,
  useAccountsStore,
} from "../../data/store/accountsStore";
import { saveUser } from "../../utils/api";

export default function MainIdentityStateHandler() {
  const userAddress = useCurrentAccount();
  const privyAccountId = useAccountsStore((s) => s.privyAccountId);

  useEffect(() => {
    if (userAddress) {
      saveUser(userAddress, privyAccountId[userAddress]);
      refreshProfileForAddress(userAddress, userAddress);
    }
  }, [userAddress, privyAccountId]);

  return null;
}
