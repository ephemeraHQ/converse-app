import { IProfileSocials } from "@/features/profiles/profile-types";
import { formatConverseUsername } from "@/features/profiles/utils/format-converse-username";
import {
  getInboxProfileSocialsQueryData,
  useInboxProfileSocialsQuery,
} from "@/queries/useInboxProfileSocialsQuery";
import { InboxId } from "@xmtp/react-native-sdk";
import { useMemo } from "react";

export function useInboxUsername(args: { inboxId: InboxId }) {
  const { inboxId } = args;

  const { data: profileSocials, isLoading } = useInboxProfileSocialsQuery({
    inboxId,
    caller: "useInboxUsername",
  });

  const username = useMemo(() => {
    if (!profileSocials) return undefined;
    return getUsernameFromSocials(profileSocials[0])?.username;
  }, [profileSocials]);

  return {
    data: username,
    isLoading,
  };
}

export function getInboxUsername(args: { inboxId: InboxId }) {
  const { inboxId } = args;

  const profileSocials = getInboxProfileSocialsQueryData({
    inboxId,
  });

  if (!profileSocials) {
    return undefined;
  }

  return getUsernameFromSocials(profileSocials[0])?.username;
}

function getUsernameFromSocials(socials: IProfileSocials) {
  return formatConverseUsername(
    socials.userNames?.find((name) => name.isPrimary)?.name
  );
}
