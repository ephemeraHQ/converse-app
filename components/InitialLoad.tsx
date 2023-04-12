import { useHeaderHeight } from "@react-navigation/elements";
import {
  ColorSchemeName,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Platform,
} from "react-native";

import { backgroundColor, textPrimaryColor } from "../utils/colors";
import ActivityIndicator from "./ActivityIndicator/ActivityIndicator";

export default function InitialLoad() {
  const headerHeight = useHeaderHeight();
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  return (
    <View
      style={[
        styles.initialLoad,
        { paddingTop: headerHeight + Platform.OS === "ios" ? 52 : 0 },
      ]}
    >
      <ActivityIndicator />
      <Text style={styles.welcome}>Welcome to Converse!</Text>
      <Text style={styles.p}>
        We’re checking if you already own{"\n"}conversations on the XMTP
        network.
      </Text>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    initialLoad: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      backgroundColor: backgroundColor(colorScheme),
    },
    welcome: {
      marginTop: 15,
      marginBottom: 3,
      color: textPrimaryColor(colorScheme),
      textAlign: "center",
      fontWeight: "bold",
      ...Platform.select({
        default: { fontSize: 17 },
        android: { fontSize: 16 },
      }),
    },
    p: {
      color: textPrimaryColor(colorScheme),
      textAlign: "center",
      ...Platform.select({
        default: { fontSize: 17 },
        android: { fontSize: 16 },
      }),
    },
  });
