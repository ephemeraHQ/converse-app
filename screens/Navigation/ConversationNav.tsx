import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { ConversationScreen } from "../Conversation";
import { NativeStack } from "./Navigation";

export type ConversationNavParams = {
  topic?: ConversationTopic;
  text?: string;
  peer?: string;
};

export const ConversationScreenConfig = {
  path: "/conversation",
  parse: {
    topic: decodeURIComponent,
  },
  stringify: {
    topic: encodeURIComponent,
  },
};

export function ConversationNav() {
  return (
    <NativeStack.Screen name="Conversation" component={ConversationScreen} />
  );
}
