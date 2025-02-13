import { useState } from "react";
import { useCurrentAccount } from "@/features/authentication/account.store";
import {} from "@utils/str";
import { useProfileSocials } from "@/hooks/useProfileSocials";
import { ProfileType } from "../types/onboarding.types";
import { config } from "@/config";

export function useProfile() {
  const currentAccount = useCurrentAccount()!; // We assume if someone goes to this screen we have address

  const { data: socials } = useProfileSocials(currentAccount);
  const currentUserUsername = socials?.userNames?.find((u) => u.isPrimary);

  const usernameWithoutSuffix = currentUserUsername?.name?.replace(
    config.usernameSuffix,
    ""
  );

  const [profile, setProfile] = useState<ProfileType>({
    username: usernameWithoutSuffix || "",
    avatar: currentUserUsername?.avatar || "",
    displayName: currentUserUsername?.displayName || "",
  });

  return { profile, setProfile };
}
