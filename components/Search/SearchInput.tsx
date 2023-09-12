import React from "react";
import { Text, TextInput, View, StyleSheet } from "react-native";

import MagnifyingGlass from "../../assets/magnifying-glass.svg";

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
};

const SearchInput: React.FC<SearchInputProps> = ({ value, onChangeText }) => (
  <View style={styles.searchContainer}>
    <View style={[styles.spaceBlock]}>
      <View style={[styles.searchFieldWrapper]}>
        <View style={styles.searchField}>
          <MagnifyingGlass style={styles.iconMagnifyingGlass} />
          <TextInput
            style={styles.query}
            value={value}
            onChangeText={onChangeText}
            placeholder="Search"
          />
        </View>
        <Text style={[styles.cancel]}>Cancel</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  searchContainer: {
    height: 70,
    marginTop: 140,
    backgroundColor: "white",
    alignSelf: "stretch",
  },
  spaceBlock: {
    height: 80,
    padding: 20,
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  query: {
    marginLeft: 6,
    color: "rgba(60, 60, 67, 0.6)",
    textAlign: "left",
    lineHeight: 22,
    letterSpacing: 0,
    fontSize: 17,
    flex: 1,
  },

  searchFieldWrapper: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  searchField: {
    borderRadius: 10,
    backgroundColor: "rgba(118, 118, 128, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 7,
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
  },
  iconMagnifyingGlass: {
    width: 16,
    height: 16,
  },
  cancel: {
    display: "none",
    marginLeft: 14,
    textAlign: "right",
    color: "#007aff",
    lineHeight: 22,
    letterSpacing: 0,
    fontSize: 17,
  },
});

export default SearchInput;
