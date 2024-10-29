import { memo } from "react";
import { ActivityIndicator } from "react-native";

import { Text } from "../../design-system/Text";
import { VStack } from "../../design-system/VStack";
import { useHeader } from "../../navigation/useHeader";

function useIsLoading() {
  return false;
}

export const ExampleHeader = memo(function ExampleHeader() {
  const isLoading = useIsLoading();

  useHeader(
    {
      title: "Example Header",
      LeftActionComponent: isLoading ? (
        <ActivityIndicator />
      ) : (
        <LeftActionComponent />
      ),
    },
    [isLoading]
  );

  return <VStack>{/* rest of content of the screen */}</VStack>;
});

// Exampel of custom left action component
const LeftActionComponent = memo(function LeftActionComponent() {
  return <Text>Left</Text>;
});
