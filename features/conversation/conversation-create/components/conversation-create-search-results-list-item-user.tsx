import { Avatar } from "@/components/Avatar";
import { useConversationStore } from "@/features/conversation/conversation.store-context";
import { useInboxUsername } from "@/features/profiles/utils/inbox-username";
import { ConversationSearchResultsListItem } from "@/features/conversation/conversation-create/components/conversation-create-search-result-list-item";
import { usePreferredInboxAvatar } from "@/hooks/usePreferredInboxAvatar";
import { useAppTheme } from "@/theme/useAppTheme";
import { shortAddress } from "@/utils/strings/shortAddress";
import { useCallback } from "react";
import { getAllProfilesForUser } from "@/features/profiles/profiles.api";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";

const getAllProfilesForSignedInUserQueryOptions = () => {
  const signedInUserId = getSignedInUserId();
  if (!signedInUserId) {
    throw new Error(
      "You called getAllProfilesForSignedInUserQueryOptions but you are not signed in"
    );
  }
  return queryOptions({
    queryKey: ["profiles", signedInUserId],
    queryFn: () => getAllProfilesForUser({ convosUserId: signedInUserId }),
    staleTime: Infinity,
    refetchOnWindowFocus: true,
  });
};

function useGetAllProfilesForUserQuery(convosUserId: string) {
  const { data: profiles } = useQuery(
    getAllProfilesForUserQueryOptions(convosUserId)
  );
}

function useProfilesForUser() {
  const { data: profiles } = useGetAllProfilesForUserQuery({
    convosUserId: convosUserId,
  });
}

type UserSearchResultListItemProps = {
  inboxId: string;
};

export function ConversationSearchResultsListItemUser({
  inboxId,
}: UserSearchResultListItemProps) {
  const { theme } = useAppTheme();

  const { data: preferredName } = usePreferredInboxName({
    inboxId,
  });

  const { data: preferredAvatar } = usePreferredInboxAvatar({
    inboxId,
  });

  const { data: username } = useInboxUsername({
    inboxId,
  });

  const conversationStore = useConversationStore();

  const handlePress = useCallback(() => {
    conversationStore.setState({
      searchTextValue: "",
      searchSelectedUserInboxIds: [
        ...(conversationStore.getState().searchSelectedUserInboxIds ?? []),
        inboxId!,
      ],
    });
  }, [conversationStore, inboxId]);

  return (
    <ConversationSearchResultsListItem
      avatar={
        <Avatar
          uri={preferredAvatar}
          size={theme.avatarSize.md}
          name={preferredName}
        />
      }
      title={preferredName}
      subtitle={username || shortAddress(inboxId)}
      onPress={handlePress}
    />
  );
}
