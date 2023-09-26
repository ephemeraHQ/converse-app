import { useEffect } from "react";

import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import { useUserStore } from "../../data/store/accountsStore";

export default function MainIdentityStateHandler() {
  const userAddress = useUserStore((s) => s.userAddress);

  useEffect(() => {
    if (userAddress) {
      refreshProfileForAddress(userAddress, userAddress);
    }
  }, [userAddress]);

  return null;
}
