import { memo, useCallback } from "react"
import { Alert } from "react-native"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useAddGroupMembersStore } from "@/features/groups/stores/add-group-members.store"
import { SearchUsersResultsListItemEthAddress } from "@/features/search-users/search-users-results-list-item-eth-address"
import { useXmtpInboxIdFromEthAddressQuery } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address.query"
import { IEthereumAddress } from "@/utils/evm/address"

type IProps = {
  ethAddress: IEthereumAddress
}

export const AddGroupMembersSearchUsersResultsListItemEthAddress = memo(
  function AddGroupMembersSearchUsersResultsListItemEthAddress(props: IProps) {
    const { ethAddress } = props
    const currentSender = useSafeCurrentSender()
    const { addSelectedInboxId } = useAddGroupMembersStore((state) => state.actions)

    const { data: inboxId, isLoading: isLoadingInboxId } = useXmtpInboxIdFromEthAddressQuery({
      clientInboxId: currentSender.inboxId,
      targetEthAddress: ethAddress,
    })

    const handlePress = useCallback(() => {
      if (!inboxId) {
        Alert.alert("This user is not on XMTP yet!")
        return
      }

      addSelectedInboxId(inboxId)
    }, [inboxId, addSelectedInboxId])

    if (isLoadingInboxId) {
      return null
    }

    return <SearchUsersResultsListItemEthAddress ethAddress={ethAddress} onPress={handlePress} />
  },
)
