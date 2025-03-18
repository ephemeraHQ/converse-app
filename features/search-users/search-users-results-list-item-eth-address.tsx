import { memo } from "react"
import { Avatar } from "@/components/avatar"
import { Chip, ChipText } from "@/design-system/chip"
import { HStack } from "@/design-system/HStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import {
  SearchResultsListItemTitle,
  SearchUsersResultListItem,
} from "@/features/search-users/search-users-result-list-item"
import { useXmtpInboxIdFromEthAddressQuery } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address.query"
import { useAppTheme } from "@/theme/use-app-theme"
import { IEthereumAddress } from "@/utils/evm/address"
import { shortAddress } from "@/utils/strings/shortAddress"

type Props = {
  ethAddress: IEthereumAddress
  onPress: () => void
}

export const SearchUsersResultsListItemEthAddress = memo(
  function SearchUsersResultsListItemEthAddress(props: Props) {
    const { ethAddress, onPress } = props
    const { theme } = useAppTheme()

    const currentSender = useSafeCurrentSender()

    const { data: inboxId } = useXmtpInboxIdFromEthAddressQuery({
      clientInboxId: currentSender.inboxId,
      targetEthAddress: ethAddress,
    })

    const { displayName, avatarUrl } = usePreferredDisplayInfo({
      ethAddress,
    })

    return (
      <SearchUsersResultListItem
        avatar={<Avatar uri={avatarUrl} sizeNumber={theme.avatarSize.md} name={displayName} />}
        title={
          <HStack
            style={{
              alignItems: "center",
              columnGap: theme.spacing.xxxs,
            }}
          >
            <SearchResultsListItemTitle>{displayName}</SearchResultsListItemTitle>
          </HStack>
        }
        subtitle={shortAddress(ethAddress)}
        endElement={
          !inboxId ? (
            <HStack>
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
