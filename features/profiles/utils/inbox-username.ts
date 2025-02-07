import { IProfileSocials } from "@/features/profiles/profile-types";
import { formatConverseUsername } from "@/features/profiles/utils/format-converse-username";
import {
  getInboxProfileSocialsQueryConfig,
  getInboxProfileSocialsQueryData,
  useInboxProfileSocialsQuery,
} from "@/queries/useInboxProfileSocialsQuery";
import { useQueries } from "@tanstack/react-query";
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

export function useInboxesUsername(args: { inboxIds: InboxId[] }) {
  const { inboxIds } = args;

  const queriesData = useQueries({
    queries: inboxIds.map((inboxId) =>
      getInboxProfileSocialsQueryConfig({
        inboxId,
        caller: "useInboxesUsername",
      })
    ),
  });

  const usernames = queriesData
    .filter((query) => query.data)
    .map((query) => getUsernameFromSocials(query.data![0])?.username);

  return {
    data: usernames,
    isLoading: queriesData.some((query) => query.isLoading),
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
