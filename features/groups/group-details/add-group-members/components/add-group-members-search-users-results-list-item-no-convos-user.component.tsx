import { memo, useCallback } from "react"
import { Alert } from "react-native"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { SearchUsersResultsListItemNoConvosUser } from "@/features/search-users/search-users-results-list-item-no-convos-user"
import { ISocialProfile } from "@/features/social-profiles/social-profiles.api"
import { useXmtpInboxIdFromEthAddressQuery } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address.query"
import { useAddGroupMembersStore } from "../stores/add-group-members.store"

export const AddGroupMembersSearchUsersResultsListItemNoConvosUser = memo(
  function AddGroupMembersSearchUsersResultsListItemNoConvosUser(props: {
    socialProfile: ISocialProfile
  }) {
    const currentSender = useSafeCurrentSender()
    const { addSelectedInboxId } = useAddGroupMembersStore((state) => state.actions)

    const { data: inboxId, isLoading: isLoadingInboxId } = useXmtpInboxIdFromEthAddressQuery({
      clientEthAddress: currentSender.ethereumAddress,
      targetEthAddress: props.socialProfile.address,
    })

    const handlePress = useCallback(() => {
      if (inboxId) {
        addSelectedInboxId(inboxId)
      } else {
        Alert.alert("This user is not on XMTP yet!")
      }
    }, [inboxId, addSelectedInboxId])

    if (isLoadingInboxId) {
      return null
    }

    return (
      <SearchUsersResultsListItemNoConvosUser
        socialProfile={props.socialProfile}
        onPress={handlePress}
      />
    )
  },
)
