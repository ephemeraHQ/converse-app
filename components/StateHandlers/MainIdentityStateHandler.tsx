import { useEffect } from "react";

import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import { useCurrentAccount } from "../../data/store/accountsStore";
import { saveUser } from "../../utils/api";

export default function MainIdentityStateHandler() {
  const userAddress = useCurrentAccount();

  useEffect(() => {
    if (userAddress) {
      saveUser(userAddress);
      refreshProfileForAddress(userAddress, userAddress);
    }
  }, [userAddress]);

  return null;
}
