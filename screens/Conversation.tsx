import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { Center } from "@/design-system/Center";
import { Loader } from "@/design-system/loader";
import { ConversationNewDm } from "@/features/conversation/conversation-new-dm";
import { Conversation } from "@/features/conversation/conversation";
import { useConversationQuery } from "@/queries/useConversationQuery";
import { useConversationWithPeerQuery } from "@/queries/useConversationWithPeerQuery";
import { captureError } from "@/utils/capture-error";
import { VStack } from "@design-system/VStack";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { isV3Topic } from "@utils/groupUtils/groupId";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo } from "react";
import { NavigationParamList } from "./Navigation/Navigation";

export function ConversationScreen(
  props: NativeStackScreenProps<NavigationParamList, "Conversation">
) {
  const { peer, topic, text } = props.route.params || {};

  if (topic && isV3Topic(topic)) {
    return <TopicConversation topic={topic} textPrefill={text} />;
  }

  if (peer) {
    return <PeerAddressFlow peerAddress={peer} textPrefill={text} />;
  }

  captureError(new Error("No peer or topic found in ConversationScreen"));

  return <VStack />;
}

const TopicConversation = memo(function TopicConversation(props: {
  topic: ConversationTopic;
  textPrefill?: string;
}) {
  const { topic, textPrefill } = props;

  const currentAccount = useCurrentAccount()!;

  const { data: conversation } = useConversationQuery(currentAccount, topic);

  if (!conversation) {
    return (
      <Screen contentContainerStyle={{ flex: 1 }}>
        <Center style={{ flex: 1 }}>
          <Loader />
        </Center>
      </Screen>
    );
  }

  return <Conversation topic={topic} textPrefill={textPrefill} />;
});

type IPeerAddressFlowProps = {
  peerAddress: string;
  textPrefill?: string;
};

const PeerAddressFlow = memo(function PeerAddressFlow(
  args: IPeerAddressFlowProps
) {
  const { peerAddress, textPrefill } = args;
  const currentAccount = useCurrentAccount()!;

  const { data: peerConversation, isLoading: isLoadingPeerConversation } =
    useConversationWithPeerQuery(currentAccount, peerAddress);

  if (peerConversation?.topic) {
    return (
      <Conversation topic={peerConversation.topic} textPrefill={textPrefill} />
    );
  }

  if (isLoadingPeerConversation) {
    return (
      <Screen style={{ flex: 1 }}>
        <Center style={{ flex: 1 }}>
          <Loader />
        </Center>
      </Screen>
    );
  }

  return (
    <ConversationNewDm peerAddress={peerAddress} textPrefill={textPrefill} />
  );
});
