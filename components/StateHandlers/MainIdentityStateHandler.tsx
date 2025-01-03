import { useEffect } from "react";

// import { invalidateProfileSocialsQuery } from "../../data/helpers/profiles/profilesUpdate";
import {
  useAccountsStore,
  useCurrentAccount,
} from "../../data/store/accountsStore";
import { saveUser } from "../../utils/api";
import { invalidateProfileSocialsQuery } from "@/queries/useProfileSocialsQuery";

export default function MainIdentityStateHandler() {
  const userAddress = useCurrentAccount();
  const privyAccountId = useAccountsStore((s) => s.privyAccountId);

  useEffect(() => {
    if (userAddress) {
      saveUser(userAddress, privyAccountId[userAddress] as string);
      invalidateProfileSocialsQuery(userAddress, userAddress);
    }
  }, [privyAccountId, userAddress]);

  return null;
}
