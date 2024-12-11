import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { Center } from "@/design-system/Center";
import { Loader } from "@/design-system/loader";
import { Conversation } from "@/features/conversation/conversation";
import { ConversationNewDm } from "@/features/conversation/conversation-new-dm";
import { useConversationWithPeerQuery } from "@/queries/useConversationWithPeerQuery";
import { captureError } from "@/utils/capture-error";
import { VStack } from "@design-system/VStack";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { isV3Topic } from "@utils/groupUtils/groupId";
import React, { memo } from "react";
import { NavigationParamList } from "../../screens/Navigation/Navigation";

type IConversationScreenProps = NativeStackScreenProps<
  NavigationParamList,
  "Conversation"
>;

export function ConversationScreen(args: IConversationScreenProps) {
  const { route } = args;
  const { peer, topic, text } = route.params || {};

  if (!peer && !topic) {
    captureError(new Error("No peer or topic found in ConversationScreen"));
    return (
      <Screen contentContainerStyle={{ flex: 1 }}>
        <VStack />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ flex: 1 }}>
      {topic && isV3Topic(topic) ? (
        <Conversation topic={topic} textPrefill={text} />
      ) : (
        <PeerAddressFlow peerAddress={peer!} textPrefill={text} />
      )}
    </Screen>
  );
}

type IPeerAddressFlowProps = {
  peerAddress: string;
  textPrefill?: string;
};

const PeerAddressFlow = memo(function PeerAddressFlow(
  args: IPeerAddressFlowProps
) {
  const { peerAddress, textPrefill } = args;
  const currentAccount = useCurrentAccount()!;
  const { data: conversation, isLoading } = useConversationWithPeerQuery(
    currentAccount,
    peerAddress
  );

  if (isLoading) {
    return (
      <Center style={{ flex: 1 }}>
        <Loader />
      </Center>
    );
  }

  if (conversation?.topic) {
    return (
      <Conversation topic={conversation.topic} textPrefill={textPrefill} />
    );
  }

  return (
    <ConversationNewDm peerAddress={peerAddress} textPrefill={textPrefill} />
  );
});
