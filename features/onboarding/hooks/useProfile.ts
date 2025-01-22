import { useState } from "react";

import config from "@config";
import { useCurrentAccount, useSettingsStore } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import {
  formatEphemeralDisplayName,
  formatEphemeralUsername,
} from "@utils/str";
import { useProfileSocials } from "@/hooks/useProfileSocials";
import { ProfileType } from "../types/onboarding.types";

export function useProfile() {
  const currentAccount = useCurrentAccount()!; // We assume if someone goes to this screen we have address

  const { data: socials } = useProfileSocials(currentAccount);
  const currentUserUsername = socials?.userNames?.find((u) => u.isPrimary);

  const { ephemeralAccount } = useSettingsStore(
    useSelect(["ephemeralAccount"])
  );

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
    username: ephemeralAccount
      ? defaultEphemeralUsername
      : usernameWithoutSuffix || "",
    avatar: currentUserUsername?.avatar || "",
    displayName: ephemeralAccount
      ? defaultEphemeralDisplayName
      : currentUserUsername?.displayName || "",
  });

  return { profile, setProfile };
}
