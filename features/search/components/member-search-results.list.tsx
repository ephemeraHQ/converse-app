import { useCallback } from "react";
import { FlatList, View } from "react-native";
import { UserSearchResultListItem } from "./user-search-result-list-item";
import { IProfileSocials } from "@/features/profiles/profile-types";
import { IUserSearchResults } from "../search.types";
import { Text } from "@/design-system/Text";
import { useAppTheme } from "@/theme/useAppTheme";
import { searchResultsStyles } from "./search-results.styles";
import { Pressable } from "@/design-system/Pressable";
import { Avatar } from "@/components/Avatar";

const MAX_INITIAL_RESULTS = 5;

type SearchResultsListProps = {
  searchResults: IUserSearchResults;
  handleSearchResultItemPress: (args: {
    address: string;
    socials: IProfileSocials;
  }) => void;
  handleGroupPress: (topic: string) => void;
};

export function SearchResultsList({
  searchResults,
  handleSearchResultItemPress,
  handleGroupPress,
}: SearchResultsListProps) {
  const { themed } = useAppTheme();

  const {
    existingDmSearchResults = [],
    existingGroupMemberNameSearchResults = [],
    existingGroupNameSearchResults = [],
    convosSearchResults = [],
  } = searchResults;

  const renderSectionHeader = useCallback(
    (title: string) => (
      <View style={themed(searchResultsStyles.$sectionHeader)}>
        <Text
          preset="formLabel"
          style={themed(searchResultsStyles.$sectionTitle)}
        >
          {title}
        </Text>
      </View>
    ),
    [themed]
  );

  const renderDmSection = useCallback(
    (dms: IProfileSocials[], title: string) => {
      if (!dms.length) return null;
      return (
        <View>
          {renderSectionHeader(title)}
          {dms.map((socials, index) => (
            <UserSearchResultListItem
              key={`${socials.address}-${index}`}
              address={socials.address || ""}
              socials={socials}
              handleUserSearchResultPress={handleSearchResultItemPress}
            />
          ))}
        </View>
      );
    },
    [renderSectionHeader, handleSearchResultItemPress]
  );

  const renderGroupSection = useCallback(
    (groups: any[], title: string) => {
      if (!groups.length) return null;
      return (
        <View>
          {renderSectionHeader(title)}
          {groups.map((group, index) => (
            <GroupSearchResultItem
              key={`${group.groupId}-${index}`}
              group={group}
              onPress={() => handleGroupPress(group.groupId)}
            />
          ))}
        </View>
      );
    },
    [renderSectionHeader, handleGroupPress]
  );

  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      style={themed(searchResultsStyles.$container)}
      data={[null]} // Using single item to render all sections
      renderItem={() => (
        <View>
          {/* Recent DMs */}
          {renderDmSection(
            existingDmSearchResults.slice(0, MAX_INITIAL_RESULTS),
            "Recent Chats"
          )}

          {/* Groups with matching member names */}
          {renderGroupSection(
            existingGroupMemberNameSearchResults.slice(0, MAX_INITIAL_RESULTS),
            "Groups with matching members"
          )}

          {/* Groups with matching names */}
          {renderGroupSection(
            existingGroupNameSearchResults.slice(0, MAX_INITIAL_RESULTS),
            "Groups with matching names"
          )}

          {/* Remaining results */}
          {renderDmSection(
            existingDmSearchResults.slice(MAX_INITIAL_RESULTS),
            "Other Matching Chats"
          )}

          {/* Other matching results */}
          {renderDmSection(convosSearchResults, "Other Results")}

          {/* Remaining group results */}
          {renderGroupSection(
            existingGroupMemberNameSearchResults.slice(MAX_INITIAL_RESULTS),
            "Other Groups with matching members"
          )}
          {renderGroupSection(
            existingGroupNameSearchResults.slice(MAX_INITIAL_RESULTS),
            "Other Groups with matching names"
          )}
        </View>
      )}
      keyExtractor={() => "search-results"}
    />
  );
}

type GroupSearchResultItemProps = {
  group: {
    groupName: string;
    groupId: string;
    groupImageUri: string;
    firstThreeMemberNames: string[];
  };
  onPress: () => void;
};

function GroupSearchResultItem({ group, onPress }: GroupSearchResultItemProps) {
  const { theme, themed } = useAppTheme();
  const { groupName, groupImageUri, firstThreeMemberNames } = group;

  return (
    <Pressable onPress={onPress}>
      <View style={themed(searchResultsStyles.$groupContainer)}>
        <Avatar
          uri={groupImageUri}
          size={theme.avatarSize.md}
          style={themed(searchResultsStyles.$avatar)}
          name={groupName}
        />
        <View style={themed(searchResultsStyles.$groupTextContainer)}>
          <Text
            preset="bodyBold"
            style={themed(searchResultsStyles.$primaryText)}
            numberOfLines={1}
          >
            {groupName}
          </Text>
          <Text
            preset="formLabel"
            style={themed(searchResultsStyles.$secondaryText)}
            numberOfLines={1}
          >
            {firstThreeMemberNames.join(", ")}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
