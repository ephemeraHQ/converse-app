import { HeaderBackButton } from "@react-navigation/elements";
import { NativeStackNavigationProp } from "@react-navigation/native-stack/lib/typescript/src/types";

export default function AndroidBackAction({
  navigation,
}: {
  navigation: NativeStackNavigationProp<any>;
}) {
  return (
    <HeaderBackButton
      onPress={navigation.goBack}
      canGoBack={navigation.canGoBack()}
      style={{ marginLeft: -3 }}
    />
  );
}
