import { useHeaderHeight } from "@react-navigation/elements";
import {
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Platform,
  Dimensions,
} from "react-native";

import { backgroundColor, textPrimaryColor } from "../utils/colors";
import ActivityIndicator from "./ActivityIndicator/ActivityIndicator";

export default function InitialLoad() {
  const headerHeight = useHeaderHeight();
  const styles = useStyles();
  return (
    <View
      style={[
        styles.initialLoad,
        { height: Dimensions.get("window").height - headerHeight * 2 },
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

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
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
};
