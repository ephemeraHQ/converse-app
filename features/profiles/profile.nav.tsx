import { NativeStack } from "@/screens/Navigation/Navigation";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { ProfileScreen } from "./profile.screen";

export type ProfileNavParams = {
  address: string;
  fromGroupTopic?: ConversationTopic;
};

export const ProfileScreenConfig = {
  path: "/profile",
};

export function ProfileNav() {
  return <NativeStack.Screen name="Profile" component={ProfileScreen} />;
}
