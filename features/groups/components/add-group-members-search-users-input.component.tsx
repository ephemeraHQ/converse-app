import { memo, useEffect, useRef } from "react"
import { TextInput as RNTextInput } from "react-native"
import { useAddGroupMembersStore } from "@/features/groups/stores/add-group-members.store"
import { SearchUsersInput } from "@/features/search-users/search-users-input"

export const AddGroupMembersSearchUsersInput = memo(function AddGroupMembersSearchUsersInput() {
  const { selectedInboxIds } = useAddGroupMembersStore()
  const { setSearchQuery, setSelectedInboxIds } = useAddGroupMembersStore((state) => state.actions)
  const inputRef = useRef<RNTextInput | null>(null)

  // Clear the input when we set the search query to an empty string
  useEffect(() => {
    useAddGroupMembersStore.subscribe(
      (state) => state.searchQuery,
      (searchQuery) => {
        if (inputRef.current && searchQuery === "") {
          inputRef.current.clear()
        }
      },
    )
  }, [])

  return (
    <SearchUsersInput
      inputRef={inputRef}
      searchSelectedUserInboxIds={selectedInboxIds}
      onSearchTextChange={setSearchQuery}
      onSelectedInboxIdsChange={setSelectedInboxIds}
    />
  )
})
