import { memo } from "react"
import { Avatar } from "@/components/avatar"
import { Chip, ChipText } from "@/design-system/chip"
import { HStack } from "@/design-system/HStack"
import {
  SearchResultsListItemTitle,
  SearchUsersResultListItem,
} from "@/features/search-users/search-users-result-list-item"
import { ISocialProfile } from "@/features/social-profiles/social-profiles.api"
import { useAppTheme } from "@/theme/use-app-theme"

export const SearchUsersResultsListItemNoConvosUser = memo(
  function SearchUsersResultsListItemNoConvosUser(props: {
    socialProfile: ISocialProfile
    onPress: () => void
  }) {
    const { theme } = useAppTheme()

    return (
      <SearchUsersResultListItem
        avatar={
          <Avatar
            sizeNumber={theme.avatarSize.md}
            uri={props.socialProfile.avatar}
            name={props.socialProfile.name}
          />
        }
        title={
          <HStack
            style={{
              alignItems: "center",
              columnGap: theme.spacing.xxxs,
            }}
          >
            <SearchResultsListItemTitle>{props.socialProfile.name}</SearchResultsListItemTitle>
            <Chip size="xs">
              <ChipText>Not a Convos user</ChipText>
            </Chip>
            {/* {!inboxId && (
              <Chip size="xs">
                <ChipText>Not on XMTP</ChipText>
              </Chip>
            )} */}
          </HStack>
        }
        subtitle={props.socialProfile.address}
        onPress={props.onPress}
      />
    )
  },
)
