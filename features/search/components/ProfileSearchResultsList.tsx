import { useCallback } from "react";
import { FlatList, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileSearchResultListItem } from "./ProfileSearchItem";
import { IProfileSocials } from "@/features/profiles/profile-types";

type ProfileSearchProps = {
  profiles: { [address: string]: IProfileSocials };
  handleSearchResultItemPress: (args: {
    address: string;
    socials: IProfileSocials;
  }) => void;
};

export function ProfileSearchResultsList({
  profiles,
  handleSearchResultItemPress,
}: ProfileSearchProps) {
  const insets = useSafeAreaInsets();

  const keyExtractor = useCallback((address: string) => address, []);

  const renderItem = useCallback(
    ({ item: searchResultEthereumAddress }: { item: string }) => (
      <ProfileSearchResultListItem
        address={searchResultEthereumAddress}
        socials={profiles[searchResultEthereumAddress]}
        handleSearchResultItemPress={handleSearchResultItemPress}
      />
    ),
    [profiles, handleSearchResultItemPress]
  );

  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      data={Object.keys(profiles)}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onTouchStart={Keyboard.dismiss}
    />
  );
}
