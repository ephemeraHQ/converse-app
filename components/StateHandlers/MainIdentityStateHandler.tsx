import { useEffect } from "react";

import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import { currentAccount, useUserStore } from "../../data/store/accountsStore";
import { saveUser } from "../../utils/api";

export default function MainIdentityStateHandler() {
  const userAddress = useUserStore((s) => s.userAddress);

  useEffect(() => {
    if (userAddress) {
      saveUser(userAddress);
      refreshProfileForAddress(currentAccount(), userAddress);
    }
  }, [userAddress]);

  return null;
}
