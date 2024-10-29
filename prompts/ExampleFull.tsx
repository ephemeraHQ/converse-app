import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Platform, ViewStyle } from "react-native";

import { HStack } from "../design-system/HStack";
import { Text } from "../design-system/Text";
import { VStack } from "../design-system/VStack";
import { ThemedStyle, useAppTheme } from "../theme/useAppTheme";

function useIsIos() {
  return Platform.OS === "ios";
}

type IExampleFullProps = {
  isBeautiful: boolean;
};

// Main exported component at the top
export const ExampleFull = memo(function ExampleFull(props: IExampleFullProps) {
  const { isBeautiful } = props;

  const { themed, theme } = useAppTheme();

  const isIos = useIsIos();

  // ❌ Don't do this because we don't use user in the main component, so instead just use the hook inside the Header component
  // const user =useUser()

  /**
   * States
   */
  const [isMounted, setMounted] = useState(false);

  /**
   * Effects
   */
  useEffect(() => {
    console.log("mounted");
  }, []);

  // ✅ Add a comment explaining why this effect is needed
  // Business rule we've decied until Android is fixed
  useEffect(() => {
    if (isIos && isBeautiful) {
      setMounted(true);
    } else if (theme.colors.background.raised) {
      setMounted(false);
    }
  }, [isIos, isBeautiful, theme]);

  /**
   * Handlers
   */
  const handleMount = useCallback(() => {
    setMounted(true);
  }, []);

  /**
   * Computed
   */
  const shouldShow = isMounted && true;

  // DON'T DO THIS ❌
  // const showSearchTitleHeader =
  //   isIos && isBeautiful ? false : isMounted && isIos ? true : false;

  // DO THIS ✅
  // We prefer useMemo with early returns for complex conditions
  const showHeader = useMemo(() => {
    if (isIos && isBeautiful) {
      return false;
    }

    if (isMounted && isIos) {
      return true;
    }

    return false;
  }, [isIos, isBeautiful, isMounted]);

  // ✅ But if the condition is simple, we prefer inline styles
  const showHeaderTwo = isIos && isBeautiful;

  // ✅ Early return for simple conditions
  if (!shouldShow) {
    return null;
  }

  return (
    <VStack
      style={[
        themed($container),
        isIos && { paddingTop: 0 },
        isBeautiful && { backgroundColor: theme.colors.background.sunken },
      ]}
    >
      {showHeader && showHeaderTwo && (
        <Header
          isBeautiful={isBeautiful}
          // ❌ Don't do this. Since we have a simple reusable hook we prefer reusing it then prop drilling stuff
          // isIos={isIos}

          // ❌ Don't do this because we don't use user in the main component, so instead just use the hook inside the Header component
          // user={user}
        />
      )}
      <Text>Hello</Text>
    </VStack>
  );
});

// ✅ We use our theme to style the component
const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background.sunken,
  padding: spacing.md,
});

// Props above component declaration
type IHeaderProps = {
  isBeautiful: boolean;
};

// Other components are below the main exported component
const Header = memo(function Header(props: IHeaderProps) {
  const { isBeautiful } = props;

  const user = useUser();

  const { theme, themed } = useAppTheme();

  const isIos = useIsIos();

  // We love early returns
  if (!isIos) {
    return null;
  }

  return (
    <HStack
      style={[
        themed($headerContainerStyle),
        // ✅ Inline styles are preferred for conditional like this
        isBeautiful && { backgroundColor: theme.colors.background.surface },
      ]}
    >
      <Text preset="title">The header for {user.name}</Text>
    </HStack>
  );
});

const $headerContainerStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background.sunken,
});

function useUser() {
  return {
    name: "John",
  };
}
