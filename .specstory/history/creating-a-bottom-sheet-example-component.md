## SpecStory

## Creating a Bottom Sheet Example Component (11/8/2024, 11:35:50 AM)

_**User**_

do something for bottom sheeet like in @Button.example.tsx but look how to do it by looking at @BottomSheetModalDemo.tsx 

---

_**Assistant**_

I'll help create a BottomSheet example component similar to the Button example. Based on the BottomSheetModalDemo and other components, here's a comprehensive example:

```typescript:design-system/BottomSheet/BottomSheet.example.tsx
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { memo, useCallback } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Button } from "../Button/Button";
import { Text } from "../Text";
import { VStack } from "../VStack";
import { useBottomSheetModalRef } from "./BottomSheet.utils";
import { BottomSheetContentContainer } from "./BottomSheetContentContainer";
import { BottomSheetModal } from "./BottomSheetModal";
import { BottomSheetHeader } from "./BottomSheetHeader";
import { useAppTheme } from "../../theme/useAppTheme";
import { BottomSheetFlatList } from "./BottomSheetFlatList";

type IExampleProps = {
  onClose?: () => void;
};

export function BottomSheetExample(args: IExampleProps) {
  const { onClose } = args;
  const { theme } = useAppTheme();
  const basicBottomSheetRef = useBottomSheetModalRef();
  const dynamicBottomSheetRef = useBottomSheetModalRef();
  const listBottomSheetRef = useBottomSheetModalRef();

  const handleBasicPress = useCallback(() => {
    basicBottomSheetRef.current?.present();
  }, [basicBottomSheetRef]);

  const handleDynamicPress = useCallback(() => {
    dynamicBottomSheetRef.current?.present();
  }, [dynamicBottomSheetRef]);

  const handleListPress = useCallback(() => {
    listBottomSheetRef.current?.present();
  }, [listBottomSheetRef]);

  const data = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    title: `Item ${i + 1}`,
  }));

  return (
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <VStack
          style={{
            gap: theme.spacing.md,
            padding: theme.spacing.lg,
          }}
        >
          {/* Basic Bottom Sheet */}
          <Button text="Basic Bottom Sheet" onPress={handleBasicPress} />
          <BottomSheetModal ref={basicBottomSheetRef} snapPoints={["40%"]}>
            <BottomSheetContentContainer>
              <BottomSheetHeader title="Basic Bottom Sheet" />
              <VStack
                style={{
                  padding: theme.spacing.lg,
                  alignItems: "center",
                }}
              >
                <Text>This is a basic bottom sheet with a single snap point</Text>
              </VStack>
            </BottomSheetContentContainer>
          </BottomSheetModal>

          {/* Dynamic Bottom Sheet */}
          <Button text="Dynamic Bottom Sheet" onPress={handleDynamicPress} />
          <BottomSheetModal
            ref={dynamicBottomSheetRef}
            snapPoints={["25%", "50%", "90%"]}
            enableDynamicSizing
          >
            <BottomSheetContentContainer>
              <BottomSheetHeader title="Dynamic Bottom Sheet" />
              <VStack
                style={{
                  padding: theme.spacing.lg,
                  alignItems: "center",
                }}
              >
                <Text>
                  This bottom sheet has multiple snap points and dynamic sizing
                </Text>
              </VStack>
            </BottomSheetContentContainer>
          </BottomSheetModal>

          {/* Bottom Sheet with List */}
          <Button text="Bottom Sheet with List" onPress={handleListPress} />
          <BottomSheetModal ref={listBottomSheetRef} snapPoints={["50%", "90%"]}>
            <BottomSheetContentContainer>
              <BottomSheetHeader title="List Example" />
              <BottomSheetFlatList
                data={data}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <VStack
                    style={{
                      padding: theme.spacing.md,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border.subtle,
                    }}
                  >
                    <Text>{item.title}</Text>
                  </VStack>
                )}
              />
            </BottomSheetContentContainer>
          </BottomSheetModal>
        </VStack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
```

This example showcases different use cases of the BottomSheet component:

1. Basic bottom sheet with a single snap point
2. Dynamic bottom sheet with multiple snap points and dynamic sizing
3. Bottom sheet with a scrollable list using BottomSheetFlatList

The example follows the same pattern as the Button example, demonstrating various features and configurations of the BottomSheet component while maintaining the project's coding style and conventions.

---



---

