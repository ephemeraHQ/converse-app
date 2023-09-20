import { useColorScheme } from "react-native";

import { navigationSecondaryBackgroundColor } from "../../utils/colors";
import WebviewPreview from "../WebviewPreview";
import { NativeStack, navigationAnimation } from "./Navigation";

export default function WebviewPreviewNav() {
  const colorScheme = useColorScheme();
  return (
    <NativeStack.Screen
      name="WebviewPreview"
      component={WebviewPreview}
      options={{
        headerTitle: "File preview",
        presentation: "modal",
        headerStyle: {
          backgroundColor: navigationSecondaryBackgroundColor(colorScheme),
        },
        animation: navigationAnimation,
      }}
    />
  );
}
