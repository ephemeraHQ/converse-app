import { useEffect } from "react";
import {
  useAccountsStore,
  useCurrentAccount,
} from "@/data/store/accountsStore";
import { invalidateProfileSocialsQuery } from "@/queries/useProfileSocialsQuery";
import { saveUser } from "@/utils/api/users";

export default function MainIdentityStateHandler() {
  const userAddress = useCurrentAccount();
  const privyAccountId = useAccountsStore((s) => s.privyAccountId);

  useEffect(() => {
    if (userAddress) {
      saveUser(userAddress, privyAccountId[userAddress] as string);
      invalidateProfileSocialsQuery(userAddress);
    }
  }, [privyAccountId, userAddress]);

  return null;
}
