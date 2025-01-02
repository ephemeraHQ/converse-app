import { HeaderBackButton } from "@react-navigation/elements";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { textSecondaryColor } from "@styles/colors";
import { useColorScheme } from "react-native";

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
