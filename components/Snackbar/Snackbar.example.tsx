import { Screen } from "@components/Screen/ScreenComp/Screen";
import { showSnackbar } from "@components/Snackbar/Snackbar.service";
import { Button } from "@design-system/Button/Button";
import { VStack } from "@design-system/VStack";
import { useAppTheme } from "@theme/useAppTheme";
import { Image } from "expo-image";
import { memo } from "react";
import { Dimensions } from "react-native";

export const SnackbarExample = memo(function SnackbarExample() {
  const { theme } = useAppTheme();

  const windowWidth = Dimensions.get("window").width;

  return (
    <Screen safeAreaEdges={["bottom", "top"]}>
      <VStack style={{ padding: theme.spacing.md, rowGap: theme.spacing.md }}>
        <Button
          text="Show Basic"
          onPress={() => showSnackbar({ message: "This is a basic snackbar" })}
        />
        <Button
          text="Show Error"
          onPress={() =>
            showSnackbar({
              message: "Something went wrong!",
              type: "error",
            })
          }
        />
        <Button
          text="Show Info"
          onPress={() =>
            showSnackbar({
              message: "Here's some useful information",
              type: "info",
            })
          }
        />
        <Button
          text="Show Large Text"
          onPress={() =>
            showSnackbar({
              message:
                "This is a longer message that will wrap to multiple lines and show how the snackbar handles longer content in a more spacious layout",
              isMultiLine: true,
            })
          }
        />
        <Button
          text="Show with Actions"
          onPress={() =>
            showSnackbar({
              message: "Do you want to proceed?",
              type: "info",
              actions: [
                {
                  label: "Learn more",
                  onPress: () => console.log("Learn more pressed"),
                },
              ],
            })
          }
        />
        <Button
          text="Show with actions large text"
          onPress={() =>
            showSnackbar({
              message:
                "This is a longer message that will wrap to multiple lines and show how the snackbar handles longer content in a more spacious layout",
              isMultiLine: true,
              type: "info",
              actions: [
                {
                  label: "Learn more",
                  onPress: () => console.log("Learn more pressed"),
                },
              ],
            })
          }
        />
      </VStack>

      <Image
        source={{
          uri: `https://picsum.photos/500/500`,
        }}
        style={{ width: 500, height: 500 }}
      />
    </Screen>
  );
});
