import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import React, { memo, useCallback } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { Button } from "../Button/Button"
import { Text } from "../Text"
import { VStack } from "../VStack"
import { useBottomSheetModalRef } from "./BottomSheet.utils"
import { BottomSheetContentContainer } from "./BottomSheetContentContainer"
import { BottomSheetModal } from "./BottomSheetModal"

export const BottomSheetModalDemo = memo(function BottomSheetModalDemo() {
  const bottomSheetModalRef = useBottomSheetModalRef()

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present()
  }, [bottomSheetModalRef])

  return (
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <VStack style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Button text="Open Bottom Sheet" onPress={handlePresentModalPress} />
          <BottomSheetModal ref={bottomSheetModalRef} snapPoints={["40%"]}>
            <BottomSheetContentContainer
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text>Bottom Sheet Content</Text>
            </BottomSheetContentContainer>
          </BottomSheetModal>
        </VStack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
})
