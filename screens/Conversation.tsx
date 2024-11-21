import { V3Conversation } from "../features/conversations/components/V3Conversation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { isV3Topic } from "@utils/groupUtils/groupId";
import React from "react";
import { gestureHandlerRootHOC } from "react-native-gesture-handler";
import { NavigationParamList } from "./Navigation/Navigation";
import { V3ConversationFromPeer } from "../features/conversations/components/V3ConversationFromPeer";
import { VStack } from "@design-system/VStack";

const ConversationHoc = ({
  route,
}: NativeStackScreenProps<NavigationParamList, "Conversation">) => {
  if (route.params?.topic && isV3Topic(route.params.topic)) {
    return (
      <V3Conversation
        topic={route.params.topic}
        textPrefill={route.params.text}
      />
    );
  }
  if (route.params?.mainConversationWithPeer) {
    return (
      <V3ConversationFromPeer
        peer={route.params.mainConversationWithPeer}
        textPrefill={route.params.text}
        skipLoading={route.params.skipLoading ?? true}
      />
    );
  }
  return <VStack />;
};

export default gestureHandlerRootHOC(ConversationHoc);
