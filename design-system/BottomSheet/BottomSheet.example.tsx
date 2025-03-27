import { Button } from "@design-system/Button/Button"
import { Text } from "@design-system/Text"
import { useCallback } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAppTheme } from "@/theme/use-app-theme"
import { VStack } from "../VStack"
import { useBottomSheetModalRef } from "./BottomSheet.utils"
import { BottomSheetContentContainer } from "./BottomSheetContentContainer"
import { BottomSheetFlatList } from "./BottomSheetFlatList"
import { BottomSheetHeader } from "./BottomSheetHeader"
import { BottomSheetModal } from "./BottomSheetModal"

export function BottomSheetExample() {
  const { theme } = useAppTheme()
  const basicBottomSheetRef = useBottomSheetModalRef()
  const dynamicBottomSheetRef = useBottomSheetModalRef()
  const listBottomSheetRef = useBottomSheetModalRef()

  const handleBasicPress = useCallback(() => {
    basicBottomSheetRef.current?.present()
  }, [basicBottomSheetRef])

  const handleDynamicPress = useCallback(() => {
    dynamicBottomSheetRef.current?.present()
  }, [dynamicBottomSheetRef])

  const handleListPress = useCallback(() => {
    listBottomSheetRef.current?.present()
  }, [listBottomSheetRef])

  const data = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    title: `Item ${i + 1}`,
  }))

  const insets = useSafeAreaInsets()

  return (
    <VStack
      style={{
        gap: theme.spacing.md,
        padding: theme.spacing.lg,
      }}
    >
      {/* Basic Bottom Sheet */}
      <Button text="Basic Bottom Sheet" onPress={handleBasicPress} />
      <BottomSheetModal ref={basicBottomSheetRef} snapPoints={["40%"]}>
        <BottomSheetContentContainer
          style={{
            flex: 1,
          }}
        >
          <BottomSheetHeader title="Basic Bottom Sheet" />
          <VStack
            style={{
              flex: 1,
            }}
          />
          <VStack
            style={{
              paddingHorizontal: theme.spacing.md,
              rowGap: theme.spacing.xs,
              paddingBottom: insets.bottom,
            }}
          >
            <Button text="Continue" />
          </VStack>
        </BottomSheetContentContainer>
      </BottomSheetModal>

      {/* Dynamic Bottom Sheet */}
      <Button text="Multiple Snap Points" onPress={handleDynamicPress} />
      <BottomSheetModal
        topInset={insets.top}
        ref={dynamicBottomSheetRef}
        snapPoints={["25%", "50%", "75%", "100%"]}
      >
        <BottomSheetContentContainer>
          <BottomSheetHeader title="Multiple Snap Points" />
          <VStack
            style={{
              paddingHorizontal: theme.spacing.md,
            }}
          >
            <Text>This bottom sheet has many snap points for fine-grained control</Text>
          </VStack>
        </BottomSheetContentContainer>
      </BottomSheetModal>

      {/* Bottom Sheet with List */}
      <Button text="Bottom Sheet with List" onPress={handleListPress} />
      <BottomSheetModal topInset={insets.top} ref={listBottomSheetRef} snapPoints={["50%", "100%"]}>
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
      </BottomSheetModal>
    </VStack>
  )
}
