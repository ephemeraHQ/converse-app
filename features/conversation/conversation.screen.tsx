import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { Conversation } from "@/features/conversation/conversation";
import { $globalStyles } from "@/theme/styles";
import { captureError } from "@/utils/capture-error";
import { VStack } from "@design-system/VStack";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { useState } from "react";
import { NavigationParamList } from "../../screens/Navigation/Navigation";

type IConversationScreenProps = NativeStackScreenProps<
  NavigationParamList,
  "Conversation"
>;

export function ConversationScreen(args: IConversationScreenProps) {
  const { route } = args;
  const { topic, text, inboxIds, isNew } = route.params || {};

  const [selectedTopic, setSelectedTopic] = useState<
    ConversationTopic | undefined
  >(topic);

  if (!topic && !isNew) {
    captureError(new Error("No topic or isNew found in ConversationScreen"));
    return (
      <Screen contentContainerStyle={$globalStyles.flex1}>
        <VStack />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={$globalStyles.flex1}>
      <Conversation topic={selectedTopic} textPrefill={text} />
    </Screen>
  );
}

// type IPeerAddressFlowProps = {
//   peerAddress: string;
//   textPrefill?: string;
// };

// const PeerAddressFlow = memo(function PeerAddressFlow(
//   args: IPeerAddressFlowProps
// ) {
//   const { peerAddress, textPrefill } = args;
//   const currentAccount = useCurrentAccount()!;

//   logger.info("[ConversationScreen][PeerAddressFlow] Initializing", {
//     peerAddress,
//     textPrefill,
//     currentAccount,
//   });

//   const { data: dmConversation, isLoading } = useDmQuery({
//     account: currentAccount,
//     peer: peerAddress,
//   });

//   if (isLoading) {
//     logger.info(
//       "[ConversationScreen][PeerAddressFlow] Loading DM conversation"
//     );
//     return (
//       <Center style={$globalStyles.flex1}>
//         <Loader />
//       </Center>
//     );
//   }

//   logger.info("[ConversationScreen][PeerAddressFlow] DM conversation loaded", {
//     hasTopic: !!dmConversation?.topic,
//     topic: dmConversation?.topic,
//   });

//   if (dmConversation?.topic) {
//     return (
//       <Conversation topic={dmConversation.topic} textPrefill={textPrefill} />
//     );
//   }

//   return (
//     <ConversationNew peerAddress={peerAddress} textPrefill={textPrefill} />
//   );
// });
