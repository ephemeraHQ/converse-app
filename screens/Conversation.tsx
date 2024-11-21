import { V3Conversation } from "@components/Conversation/V3Conversation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { isV3Topic } from "@utils/groupUtils/groupId";
import React from "react";
import { View } from "react-native";
import { gestureHandlerRootHOC } from "react-native-gesture-handler";
import { NavigationParamList } from "./Navigation/Navigation";

const ConversationHoc = ({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Conversation">) => {
  if (route.params?.topic && isV3Topic(route.params.topic)) {
    return <V3Conversation route={route} navigation={navigation} />;
  }
  // TODO: Inform user that the conversation is not available
  return <View />;
};

export default gestureHandlerRootHOC(ConversationHoc);
