import { memo } from "react"
import { Avatar } from "@/components/avatar"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { useAppTheme } from "@/theme/use-app-theme"
import {
  SearchResultsListItemProps,
  SearchUsersResultListItem,
} from "./search-users-result-list-item"

export const SearchUsersResultsListItemUser = memo(function SearchUsersResultsListItemUser(
  props: Partial<SearchResultsListItemProps> & {
    inboxId: IXmtpInboxId
    onPress: () => void
  },
) {
  const { inboxId, onPress, ...rest } = props

  const { theme } = useAppTheme()

  const { displayName, avatarUrl, username } = usePreferredDisplayInfo({
    inboxId,
  })

  return (
    <SearchUsersResultListItem
      avatar={<Avatar name={displayName} uri={avatarUrl} sizeNumber={theme.avatarSize.md} />}
      title={displayName ?? " "}
      subtitle={username ?? ""}
      onPress={onPress}
      {...rest}
    />
  )
})
