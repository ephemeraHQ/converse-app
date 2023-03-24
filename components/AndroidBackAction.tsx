import { HeaderBackButton } from "@react-navigation/elements";
import { NativeStackNavigationProp } from "@react-navigation/native-stack/lib/typescript/src/types";
import { useColorScheme } from "react-native";

import { textSecondaryColor } from "../utils/colors";

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
      style={{ marginLeft: -3 }}
      tintColor={textSecondaryColor(colorScheme)}
    />
  );
}
