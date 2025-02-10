import { useConversationMessageReactions } from "@/features/conversation/conversation-message/conversation-message.utils";
import { isCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { getInboxProfileSocialsQueryConfig } from "@/queries/useInboxProfileSocialsQuery";
import { useQueries } from "@tanstack/react-query";
import {
  getPreferredInboxAddress,
  getPreferredInboxAvatar,
  getPreferredInboxName,
} from "@utils/profile";
import { useMemo } from "react";
import {
  RolledUpReactions,
  SortedReaction,
} from "./conversation-message-reactions.types";
import { MessageId } from "@xmtp/react-native-sdk";

export function useConversationMessageReactionsRolledUp(args: {
  messageId: MessageId;
}) {
  const { messageId } = args;

  const { bySender: reactionsBySender } =
    useConversationMessageReactions(messageId);

  const inboxIds = Array.from(
    new Set(
      Object.entries(reactionsBySender ?? {}).map(
        ([senderInboxId]) => senderInboxId
      )
    )
  );

  const inboxProfileSocialsQueries = useQueries({
    queries: inboxIds.map((inboxId) =>
      getInboxProfileSocialsQueryConfig({ inboxId })
    ),
  });

  const membersSocials = inboxProfileSocialsQueries.map(
    ({ data: socials }, index) => {
      return {
        inboxId: inboxIds[index],
        address: getPreferredInboxAddress(socials),
        uri: getPreferredInboxAvatar(socials),
        name: getPreferredInboxName(socials),
      };
    }
  );

  return useMemo((): RolledUpReactions => {
    const detailed: SortedReaction[] = [];
    let totalCount = 0;
    let userReacted = false;

    // Flatten reactions and track sender addresses
    const flatReactions = Object.entries(reactionsBySender ?? {}).flatMap(
      ([senderInboxId, senderReactions]) =>
        senderReactions.map((reaction) => ({ senderInboxId, ...reaction }))
    );
    totalCount = flatReactions.length;

    // Track reaction counts for preview
    const previewCounts = new Map<string, number>();

    flatReactions.forEach((reaction) => {
      const isOwnReaction = isCurrentAccountInboxId(reaction.senderInboxId);

      if (isOwnReaction) {
        userReacted = true;
      }

      // Count reactions for the preview
      previewCounts.set(
        reaction.content,
        (previewCounts.get(reaction.content) || 0) + 1
      );

      const socialDetails = membersSocials.find(
        (social) => social.inboxId === reaction.senderInboxId
      );

      detailed.push({
        content: reaction.content,
        isOwnReaction,
        reactor: {
          address: reaction.senderInboxId,
          userName: socialDetails?.name,
          avatar: socialDetails?.uri,
        },
      });
    });

    // Sort detailed array to place all OWN reactions at the beginning
    detailed.sort((a, b) => Number(b.isOwnReaction) - Number(a.isOwnReaction));

    // Convert previewCounts map to array with content and count
    const preview = Array.from(previewCounts, ([content, count]) => ({
      content,
      count,
    }));

    return {
      totalCount,
      userReacted,
      preview,
      detailed,
    };
  }, [reactionsBySender, membersSocials]);
}
