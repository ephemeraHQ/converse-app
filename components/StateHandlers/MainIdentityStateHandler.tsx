import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { invalidateProfileSocialsQuery } from "@/queries/useProfileSocialsQuery";
import { saveUser } from "@/utils/api/users";
import { useEffect } from "react";

export function MainIdentityStateHandler() {
  const userAddress = useCurrentAccount();

  useEffect(() => {
    if (userAddress) {
      saveUser({ address: userAddress });
      invalidateProfileSocialsQuery(userAddress);
    }
  }, [userAddress]);

  return null;
}
