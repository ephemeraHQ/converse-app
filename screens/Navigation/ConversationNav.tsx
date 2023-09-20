import Conversation from "../Conversation";
import { NativeStack, navigationAnimation } from "./Navigation";

export default function ConversationNav() {
  return (
    <NativeStack.Screen
      name="Conversation"
      component={Conversation}
      options={{
        animation: navigationAnimation,
      }}
    />
  );
}
