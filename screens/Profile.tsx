import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ColorSchemeName,
  ScrollView,
  useColorScheme,
} from "react-native";

import TableView, { TableViewPicto } from "../components/TableView";
import { loadProfileByAddress } from "../data";
import { Profile } from "../data/db/entities/profile";
import { backgroundColor } from "../utils/colors";
import { NavigationParamList } from "./Main";

export default function ProfileScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Profile">) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    const go = async () => {
      const loadedProfile = await loadProfileByAddress(route.params.address);
      setProfile(loadedProfile);
    };
    go();
  }, [route.params.address]);
  const addressItems = [
    {
      id: "address",
      picto: <TableViewPicto symbol="arrow.up.right" />,
      title: route.params.address,
    },
  ];
  return (
    <ScrollView
      style={styles.profile}
      contentContainerStyle={styles.profileContent}
    >
      <TableView
        items={addressItems}
        title="Address"
        style={styles.tableView}
      />
    </ScrollView>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    profile: {
      backgroundColor: backgroundColor(colorScheme),
    },
    profileContent: {
      alignItems: "center",
      paddingBottom: 65,
    },
    tableView: {},
  });
