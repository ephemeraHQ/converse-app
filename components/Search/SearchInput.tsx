import React from "react";
import { TextInput, View, StyleSheet } from "react-native";

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
};

const SearchInput: React.FC<SearchInputProps> = ({ value, onChangeText }) => (
  <View style={styles.searchContainer}>
    <TextInput
      style={styles.searchInput}
      value={value}
      onChangeText={onChangeText}
      placeholder="Search..."
    />
  </View>
);

const styles = StyleSheet.create({
  searchContainer: {
    height: 60,
    marginTop: 145,
  },
  searchInput: {
    height: 60,
    backgroundColor: "#f1f1f1",
    padding: 20,
    borderRadius: 8,
  },
});

export default SearchInput;
