import { InboxId } from "@xmtp/react-native-sdk"
import { AppNativeStack } from "@/navigation/app-navigator"
import { ProfileScreen } from "./profile.screen"

export type ProfileNavParams = {
  inboxId: InboxId
}

export const ProfileScreenConfig = {
  path: "/profile",
}

export function ProfileNav() {
  return <AppNativeStack.Screen name="Profile" component={ProfileScreen} />
}
