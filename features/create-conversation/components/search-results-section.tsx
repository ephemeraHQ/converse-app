import React from "react";
import { View } from "react-native";
import { useAppTheme } from "@/theme/useAppTheme";
import { createConversationStyles } from "../create-conversation.styles";
import { SearchResultsSectionProps } from "../create-conversation.types";
import { ProfileSearchResultsList } from "@/features/search/components/ProfileSearchResultsList";

/**
 * Displays search results for profiles when creating a conversation
 *
 * @param props.profiles - Object containing profile search results
 * @param props.onSelectProfile - Callback when a profile is selected
 */
export function SearchResultsSection({
  profiles,
  onSelectProfile,
}: SearchResultsSectionProps) {
  const { themed } = useAppTheme();

  if (Object.keys(profiles).length === 0) return null;

  const $searchSection = themed(createConversationStyles.$searchSection);

  return (
    <View style={$searchSection}>
      <ProfileSearchResultsList
        profiles={profiles}
        handleSearchResultItemPress={onSelectProfile}
      />
    </View>
  );
}
