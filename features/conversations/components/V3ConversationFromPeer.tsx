import { useConversationWithPeerQuery } from "@/queries/useConversationWithPeerQuery";
import ActivityIndicator from "@components/ActivityIndicator/ActivityIndicator";
import { useCurrentAccount } from "@data/store/accountsStore";
import { memo } from "react";
import { VStack } from "@design-system/VStack";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { ViewStyle } from "react-native";
import { V3Conversation } from "@components/Conversation/V3Conversation";

type V3ConversationFromPeerProps = {
  peer: string;
  textPrefill?: string;
  skipLoading: boolean;
};

/**
 * A component that renders a conversation from a peer.
 * It is used to render a conversation from a peer.
 * This is a wrapper around the V3Conversation component to help load the conversation and abstract some logic.
 * If we want the best peformance we should rework this component
 */
export const V3ConversationFromPeer = memo(
  ({ peer, textPrefill, skipLoading }: V3ConversationFromPeerProps) => {
    const currentAccount = useCurrentAccount()!;

    const { data: conversation, isLoading } = useConversationWithPeerQuery(
      currentAccount,
      peer,
      {
        enabled: !skipLoading,
      }
    );

    const { themed } = useAppTheme();
    if (isLoading && !skipLoading) {
      return (
        <VStack style={themed($container)}>
          <ActivityIndicator />
        </VStack>
      );
    }
    return (
      <V3Conversation
        peerAddress={peer}
        topic={conversation?.topic}
        textPrefill={textPrefill}
      />
    );
  }
);

const $container: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: theme.colors.background.surface,
});
