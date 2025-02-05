import { useState } from "react";
import { useCurrentAccount, useSettingsStore } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import {
  formatEphemeralDisplayName,
  formatEphemeralUsername,
} from "@utils/str";
import { useProfileSocials } from "@/hooks/useProfileSocials";
import { ProfileType } from "../types/onboarding.types";
import { config } from "@/config";

export function useProfile() {
  const currentAccount = useCurrentAccount()!; // We assume if someone goes to this screen we have address

  const { data: socials } = useProfileSocials(currentAccount);
  const currentUserUsername = socials?.userNames?.find((u) => u.isPrimary);

  const { ephemeralAccount, isRandoAccount } = useSettingsStore(
    useSelect(["ephemeralAccount", "isRandoAccount"])
  );

  const isNotDoxxedAccount = ephemeralAccount || isRandoAccount;

  const usernameWithoutSuffix = currentUserUsername?.name?.replace(
    config.usernameSuffix,
    ""
  );

  const defaultEphemeralUsername = formatEphemeralUsername(
    currentAccount,
    usernameWithoutSuffix
  );
  const defaultEphemeralDisplayName = formatEphemeralDisplayName(
    currentAccount,
    currentUserUsername?.displayName
  );

  const [profile, setProfile] = useState<ProfileType>({
    username: isNotDoxxedAccount
      ? defaultEphemeralUsername
      : usernameWithoutSuffix || "",
    avatar: currentUserUsername?.avatar || "",
    displayName: isNotDoxxedAccount
      ? defaultEphemeralDisplayName
      : currentUserUsername?.displayName || "",
  });

  return { profile, setProfile };
}
