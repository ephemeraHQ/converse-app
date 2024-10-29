import { memo, useMemo } from "react";
import { View } from "react-native";

import { useChatStore } from "../data/store/accountsStore";
import { Text } from "../design-system/Text";
import { VStack } from "../design-system/VStack";
import { sortRequestsBySpamScore } from "../utils/xmtpRN/conversations";

/**
 *
 * Example 1: Data fetching far from usage
 * ❌ Bad - Data fetching and computation far from where it's used
 */
export const ExampleOne = memo(function ExampleOne() {
  const { sortedConversationsWithPreview } = useChatStore();

  const spamCount = useMemo(() => {
    const { likelyNotSpam } = sortRequestsBySpamScore(
      sortedConversationsWithPreview.conversationsRequests
    );
    return likelyNotSpam.length;
  }, [sortedConversationsWithPreview.conversationsRequests]);

  return (
    <VStack>
      <SpamDisplay spamCount={spamCount} />
      <Text>This is some text</Text>
    </VStack>
  );
});

const SpamDisplay = memo(function SpamDisplay(props: { spamCount: number }) {
  return (
    <View>
      <Text>{props.spamCount}</Text>
    </View>
  );
});

/**
 *
 * Example 2: Data fetching close to usage
 * ✅ Better - Data fetching and computation close to where it's used
 */
export const ExampleTwo = memo(function ExampleTwo() {
  return (
    <VStack>
      <SpamDisplayWithData />
      <Text>This is some text</Text>
    </VStack>
  );
});

const SpamDisplayWithData = memo(function SpamDisplayWithData() {
  const { sortedConversationsWithPreview } = useChatStore();

  const spamCount = useMemo(() => {
    const { likelyNotSpam } = sortRequestsBySpamScore(
      sortedConversationsWithPreview.conversationsRequests
    );
    return likelyNotSpam.length;
  }, [sortedConversationsWithPreview.conversationsRequests]);

  return (
    <View>
      <Text>{spamCount}</Text>
    </View>
  );
});
