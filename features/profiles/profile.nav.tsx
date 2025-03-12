import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { AppNativeStack } from "@/navigation/app-navigator"
import { ProfileScreen } from "./profile.screen"

export type ProfileNavParams = {
  inboxId: IXmtpInboxId
}

export const ProfileScreenConfig = {
  path: "/profile",
}

export function ProfileNav() {
  return <AppNativeStack.Screen name="Profile" component={ProfileScreen} />
}
