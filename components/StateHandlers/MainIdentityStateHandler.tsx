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
    const handleIdentityState = async () => {
      console.log("## calling handleIdentityState");

      if (userAddress) {
        await saveUser(userAddress, privyAccountId[userAddress]);
        console.log(`** [Identity] Saved user ${userAddress}`);

        await refreshProfileForAddress(userAddress, userAddress);
        console.log(`** [Identity] Refreshed profile for ${userAddress}`);
      }
    };

    handleIdentityState();
  }, [userAddress, privyAccountId]);

  return null;
}
