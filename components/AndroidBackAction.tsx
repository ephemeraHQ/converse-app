import { HeaderBackButton } from "@react-navigation/elements";
import { NativeStackNavigationProp } from "@react-navigation/native-stack/lib/typescript/src/types";
import { textSecondaryColor } from "@styles/colors";
import { Platform, useColorScheme } from "react-native";

export default function AndroidBackAction({
  navigation,
}: {
  navigation: NativeStackNavigationProp<any>;
}) {
  const colorScheme = useColorScheme();
  return (
    <HeaderBackButton
      onPress={navigation.goBack}
      canGoBack={navigation.canGoBack()}
      style={{ marginLeft: Platform.OS === "web" ? 15 : -3 }}
      tintColor={textSecondaryColor(colorScheme)}
    />
  );
}
