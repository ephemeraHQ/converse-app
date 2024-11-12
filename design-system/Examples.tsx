import { Screen } from "@components/Screen/ScreenComp/Screen";
import { SnackbarExample } from "@components/Snackbar/Snackbar.example";
import { BottomSheetExample } from "@design-system/BottomSheet/BottomSheet.example";
import { Button } from "@design-system/Button/Button";
import { ButtonExample } from "@design-system/Button/Button.example";
import { IconExample } from "@design-system/Icon/Icon.example";
import { IconButtonExample } from "@design-system/IconButton/IconButton.example";
import { TextExample } from "@design-system/Text/Text.example";
import { TextFieldExample } from "@design-system/TextField/TextField.example";
import { VStack } from "@design-system/VStack";
import { useAppTheme } from "@theme/useAppTheme";
import { useState } from "react";

type IDesignSystemComponent =
  | "buttons"
  | "text"
  | "icon-button"
  | "text-field"
  | "icon"
  | "header"
  | "bottom-sheet"
  | "snackbar";

export function Examples() {
  const { theme } = useAppTheme();

  const [selectedComponent, setSelectedComponent] =
    useState<IDesignSystemComponent | null>(null);

  return (
    <Screen
      safeAreaEdges={["bottom"]}
      preset="scroll"
      contentContainerStyle={{
        paddingTop: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      {selectedComponent ? (
        <VStack style={{ gap: theme.spacing.lg }}>
          <Button
            text="Back"
            onPress={() => setSelectedComponent(null)}
            variant="link"
          />
          <VStack>
            {selectedComponent === "buttons" && <ButtonExample />}
            {selectedComponent === "text" && <TextExample />}
            {selectedComponent === "icon-button" && <IconButtonExample />}
            {selectedComponent === "text-field" && <TextFieldExample />}
            {selectedComponent === "icon" && <IconExample />}
            {selectedComponent === "snackbar" && <SnackbarExample />}
            {/* {selectedComponent === "header" && <HeaderExample />} */}
            {selectedComponent === "bottom-sheet" && <BottomSheetExample />}
          </VStack>
        </VStack>
      ) : (
        <VStack
          style={{
            gap: theme.spacing.sm,
          }}
        >
          <Button
            text="Buttons"
            onPress={() => setSelectedComponent("buttons")}
          />
          <Button text="Text" onPress={() => setSelectedComponent("text")} />
          <Button
            text="Icon Button"
            onPress={() => setSelectedComponent("icon-button")}
          />
          <Button
            text="Text Field"
            onPress={() => setSelectedComponent("text-field")}
          />
          <Button text="Icon" onPress={() => setSelectedComponent("icon")} />
          {/* <Button
            text="Header"
            onPress={() => setSelectedComponent("header")}
          /> */}
          <Button
            text="Bottom Sheet"
            onPress={() => setSelectedComponent("bottom-sheet")}
          />
          <Button
            text="Snackbar"
            onPress={() => setSelectedComponent("snackbar")}
          />
        </VStack>
      )}
    </Screen>
  );
}
