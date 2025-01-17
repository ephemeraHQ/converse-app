import { NativeStack } from "@/screens/Navigation/Navigation";
import { ProfileScreen } from "./profile.screen";
import { ConversationTopic } from "@xmtp/react-native-sdk";

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
