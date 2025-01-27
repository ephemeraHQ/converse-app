import { useCallback } from "react";
import { FlatList } from "react-native";
import { UserSearchResultListItem } from "./user-search-result-list-item";
import { IProfileSocials } from "@/features/profiles/profile-types";
import type { IUserSearchResults } from "../search.types";
type ProfileSearchProps = {
  searchResults: IUserSearchResults;
  handleSearchResultItemPress: (args: {
    address: string;
    socials: IProfileSocials;
  }) => void;
};

export function SearchResultsList({
  searchResults,
  handleSearchResultItemPress,
}: ProfileSearchProps) {
  const keyExtractor = useCallback((address: string) => address, []);

  // const renderItem = useCallback(
  //   ({ item: searchResultEthereumAddress }: { item: string }) => (
  //     <UserSearchResultListItem
  //       address={searchResultEthereumAddress}
  //       socials={profiles[searchResultEthereumAddress]}
  //       handleSearchResultItemPress={handleSearchResultItemPress}
  //     />
  //   ),
  //   [profiles, handleSearchResultItemPress]
  // );

  return null;
  // return (
  //   <FlatList
  //     keyboardShouldPersistTaps="handled"
  //     data={Object.keys(profiles)}
  //     keyExtractor={keyExtractor}
  //     renderItem={renderItem}
  //   />
  // );
}
