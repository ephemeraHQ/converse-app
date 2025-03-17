import { GroupDetailsScreen } from "@/features/groups/group-details/group-details.screen"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { AppNativeStack } from "@/navigation/app-navigator"

export type GroupDetailsNavParams = {
  xmtpConversationId: IXmtpConversationId
}

export const GroupDetailsScreenConfig = {
  path: "/group-details",
  parse: {
    xmtpConversationId: decodeURIComponent,
  },
  stringify: {
    xmtpConversationId: encodeURIComponent,
  },
}

export function GroupDetailsNav() {
  return <AppNativeStack.Screen name="GroupDetails" component={GroupDetailsScreen} />
}
