import { Screen } from "@components/Screen/ScreenComp/Screen";
import { showSnackbar } from "@components/Snackbar/Snackbar.service";
import { Button } from "@design-system/Button/Button";
import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { useAppTheme } from "@theme/useAppTheme";
import { memo } from "react";

export const SnackbarExample = memo(function SnackbarExample() {
  const { theme } = useAppTheme();

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

        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum. Sed ut
          perspiciatis unde omnis iste natus error sit voluptatem accusantium
          doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo
          inventore veritatis et quasi architecto beatae vitae dicta sunt
          explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut
          odit aut fugit. Nemo enim ipsam voluptatem quia voluptas sit
          aspernatur aut odit aut fugit. Nemo enim ipsam voluptatem quia
          voluptas sit aspernatur aut odit aut fugit.
        </Text>
      </VStack>
    </Screen>
  );
});
