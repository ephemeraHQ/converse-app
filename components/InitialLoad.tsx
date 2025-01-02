import { useHeaderHeight } from "@react-navigation/elements";
import { backgroundColor, textPrimaryColor } from "@styles/colors";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

import ActivityIndicator from "./ActivityIndicator/ActivityIndicator";
import { translate } from "@/i18n";

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
      <Text style={styles.welcome}>{translate("initial_load.title")}</Text>
      <Text style={styles.p}>{translate("initial_load.subtitle")}</Text>
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
