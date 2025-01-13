import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import ProfileScreen from "../Profile";
import { NativeStack } from "./Navigation";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export type ProfileNavParams = {
  address: string;
  fromGroupTopic?: ConversationTopic;
};

export const ProfileScreenConfig = {
  path: "/profile",
};

export default function ProfileNav() {
  return (
    <NativeStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        headerTitle: "",
      }}
    />
  );
}
