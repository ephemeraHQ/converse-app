import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { Center } from "@/design-system/Center";
import { Loader } from "@/design-system/loader";
import { Conversation } from "@/features/conversation/conversation";
import { ConversationNewDm } from "@/features/conversation/conversation-new-dm";
import { useDmQuery } from "@/queries/useDmQuery";
import { $globalStyles } from "@/theme/styles";
import { captureError } from "@/utils/capture-error";
import { VStack } from "@design-system/VStack";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { isV3Topic } from "@utils/groupUtils/groupId";
import React, { memo } from "react";
import { NavigationParamList } from "../../screens/Navigation/Navigation";
import logger from "@/utils/logger";

type IConversationScreenProps = NativeStackScreenProps<
  NavigationParamList,
  "Conversation"
>;

export function ConversationScreen(args: IConversationScreenProps) {
  const { route } = args;
  const { peer, topic, text, optimistic } = route.params || {};

  logger.info("[ConversationScreen] Rendering conversation screen", {
    peer,
    topic,
    text,
    optimistic,
  });

  if (!peer && !topic) {
    const error = new Error("No peer or topic found in ConversationScreen");
    logger.error("[ConversationScreen] Missing required parameters", error);
    captureError(error);
    return (
      <Screen contentContainerStyle={{ flex: 1 }}>
        <VStack />
      </Screen>
    );
  }

  logger.info("[ConversationScreen] Rendering appropriate conversation view", {
    isV3Topic: topic ? isV3Topic(topic) : false,
  });

  return (
    <Screen contentContainerStyle={{ flex: 1 }}>
      {topic && isV3Topic(topic) ? (
        <Conversation
          topic={topic}
          textPrefill={text}
          optimistic={optimistic}
        />
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

  logger.info("[ConversationScreen][PeerAddressFlow] Initializing", {
    peerAddress,
    textPrefill,
    currentAccount,
  });

  const { data: dmConversation, isLoading } = useDmQuery({
    account: currentAccount,
    peer: peerAddress,
  });

  if (isLoading) {
    logger.info(
      "[ConversationScreen][PeerAddressFlow] Loading DM conversation"
    );
    return (
      <Center style={$globalStyles.flex1}>
        <Loader />
      </Center>
    );
  }

  logger.info("[ConversationScreen][PeerAddressFlow] DM conversation loaded", {
    hasTopic: !!dmConversation?.topic,
    topic: dmConversation?.topic,
  });

  if (dmConversation?.topic) {
    return (
      <Conversation topic={dmConversation.topic} textPrefill={textPrefill} />
    );
  }

  return (
    <ConversationNewDm peerAddress={peerAddress} textPrefill={textPrefill} />
  );
});
