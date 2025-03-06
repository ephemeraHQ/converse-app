import { memo } from "react"
import { Avatar } from "@/components/avatar"
import { Chip, ChipText } from "@/design-system/chip"
import { HStack } from "@/design-system/HStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  SearchResultsListItemTitle,
  SearchUsersResultListItem,
} from "@/features/search-users/search-users-result-list-item"
import { useXmtpInboxIdFromEthAddressQuery } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address.query"
import { useAppTheme } from "@/theme/use-app-theme"
import { shortAddress } from "@/utils/strings/shortAddress"

type Props = {
  ethAddress: string
  onPress: () => void
}

export const SearchUsersResultsListItemEthAddress = memo(
  function SearchUsersResultsListItemEthAddress(props: Props) {
    const { ethAddress, onPress } = props
    const { theme } = useAppTheme()

    const currentSender = useSafeCurrentSender()

    const { data: inboxId } = useXmtpInboxIdFromEthAddressQuery({
      clientEthAddress: currentSender.ethereumAddress,
      targetEthAddress: ethAddress,
    })

    return (
      <SearchUsersResultListItem
        avatar={<Avatar uri={undefined} sizeNumber={theme.avatarSize.md} name={ethAddress} />}
        title={
          <HStack
            style={{
              alignItems: "center",
              columnGap: theme.spacing.xxxs,
            }}
          >
            <SearchResultsListItemTitle>{shortAddress(ethAddress)}</SearchResultsListItemTitle>
          </HStack>
        }
        subtitle={
          !inboxId ? (
            <HStack
              style={{
                alignItems: "center",
                columnGap: theme.spacing.xxxs,
              }}
            >
              <Chip size="xs">
                <ChipText>Not on XMTP</ChipText>
              </Chip>
            </HStack>
          ) : undefined
        }
        onPress={onPress}
      />
    )
  },
)
