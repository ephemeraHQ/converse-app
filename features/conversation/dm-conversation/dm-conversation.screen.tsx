import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { Center } from "@/design-system/Center";
import { Loader } from "@/design-system/loader";
import { useConversationWithPeerQuery } from "@/queries/useConversationWithPeerQuery";
import { NavigationParamList } from "@/screens/Navigation/Navigation";
import { $globalStyles } from "@/theme/styles";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { memo } from "react";
import { ExistingDmConversationContent } from "./existing-dm-conversation-content";
import { NewDmConversationContent } from "./new-dm-conversation-content";

export const DmConversationScreen = memo(function DmConversationScreen(
  props: NativeStackScreenProps<NavigationParamList, "DmConversation">
) {
  const { peerAddress } = props.route.params;

  const currentAccount = useCurrentAccount()!;

  // Check if we have a conversation with the peer
  const { data: conversation, isLoading } = useConversationWithPeerQuery(
    currentAccount,
    peerAddress,
    {
      enabled: !!peerAddress,
    }
  );

  if (!peerAddress) {
    // TODO: Add error state. We should always have a peer address
    return null;
  }

  return (
    <Screen
      contentContainerStyle={{
        flex: 1,
      }}
    >
      {isLoading ? (
        <Center
          style={{
            flex: 1,
          }}
        >
          <Loader />
        </Center>
      ) : !conversation ? (
        <NewDmConversationContent peerAddress={peerAddress} />
      ) : (
        <ExistingDmConversationContent topic={conversation.topic} />
      )}
    </Screen>
  );
});
