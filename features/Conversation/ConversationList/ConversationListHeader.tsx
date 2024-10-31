import RequestsButton from "@components/ConversationList/RequestsButton";
import EphemeralAccountBanner from "@components/EphemeralAccountBanner";
import PinnedConversations from "@components/PinnedConversations/PinnedConversations";
import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { sortRequestsBySpamScore } from "@utils/xmtpRN/conversations";
import React, { memo, useMemo } from "react";
import { Platform, ViewStyle } from "react-native";

import { useConversationListContextMultiple } from "./ConversationList.context";

export const ConversationListHeader = memo(function ConversationListHeader() {
  const { themed } = useAppTheme();

  const {
    sortedConversationsWithPreview,
    pinnedConversations,
    showSearchTitleHeader,
    sharingMode,
    ephemeralAccount,
    showNoResult,
  } = useConversationListContextMultiple([
    "sortedConversationsWithPreview",
    "pinnedConversations",
    "showSearchTitleHeader",
    "sharingMode",
    "ephemeralAccount",
    "showNoResult",
  ]);

  const hasRequests =
    sortedConversationsWithPreview.conversationsRequests.length > 0;

  const requestsCount = useMemo(() => {
    const { likelyNotSpam } = sortRequestsBySpamScore(
      sortedConversationsWithPreview.conversationsRequests
    );
    return likelyNotSpam.length;
  }, [sortedConversationsWithPreview.conversationsRequests]);

  return (
    <>
      <PinnedConversations convos={pinnedConversations} />
      {showSearchTitleHeader && (
        <HStack style={themed($searchTitleContainer)}>
          <Text>Messages</Text>
        </HStack>
      )}
      {!showSearchTitleHeader && hasRequests && !sharingMode && (
        <HStack style={themed($headerTitleContainer)}>
          <Text>Messages</Text>
          <RequestsButton requestsCount={requestsCount} />
        </HStack>
      )}
      {!showSearchTitleHeader && !hasRequests && !sharingMode && (
        <HStack style={themed($headerTitleContainer)}>
          <Text>Messages</Text>
        </HStack>
      )}
      {ephemeralAccount &&
        !showNoResult &&
        !showSearchTitleHeader &&
        !sharingMode && <EphemeralAccountBanner />}
    </>
  );
});

const $searchTitleContainer: ThemedStyle<ViewStyle> = ({
  colors,
  spacing,
}) => ({
  padding: spacing.sm,
  paddingLeft: spacing.md,
  backgroundColor: colors.background.surface,
  borderBottomColor: colors.border.subtle,
  borderBottomWidth: Platform.OS === "ios" ? 0.5 : 0,
});

const $headerTitleContainer: ThemedStyle<ViewStyle> = ({
  colors,
  spacing,
}) => ({
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: spacing.sm,
  paddingBottom: spacing.xs,
  paddingHorizontal: spacing.md,
  backgroundColor: colors.background.surface,
  borderTopWidth: Platform.OS === "ios" ? 0.25 : 0,
  borderTopColor: colors.border.subtle,
});
