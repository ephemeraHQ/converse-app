import { memo } from "react";

import Avatar from "../../components/Avatar";
import { useAppTheme } from "../../theme/useAppTheme";
import { HStack } from "../HStack";
import { ScrollView } from "../ScrollView";
import { Text } from "../Text";
import { Header } from "./Header";
import { HeaderAction } from "./HeaderAction";

export const HeaderDemo = memo(function HeaderDemo() {
  const { theme } = useAppTheme();
  return (
    <ScrollView
      contentContainerStyle={{
        rowGap: 16,
        paddingVertical: 16,
      }}
    >
      {/* Basic header with title */}
      <Header
        title="Basic Header"
        backgroundColor={theme.colors.background.surface}
      />

      {/* Header with navigation actions */}
      <Header
        title="With Actions"
        leftIcon="chevron.left"
        onLeftPress={() => {}}
        rightIcon="xmark"
        onRightPress={() => {}}
        backgroundColor={theme.colors.background.surface}
      />

      {/* Header with custom title and actions and collapsible indicator */}
      <Header
        isCollapsible
        titleComponent={
          <HStack
            style={{
              alignItems: "center",
              columnGap: theme.spacing.xs,
            }}
          >
            <Avatar size={theme.avatarSize.sm} />
            <Text
              preset="body"
              text="Andrew"
              style={{ color: theme.colors.text.primary }}
            />
          </HStack>
        }
        RightActionComponent={
          <HStack
            style={{
              alignItems: "center",
              columnGap: theme.spacing.xs,
            }}
          >
            <HeaderAction
              icon="qrcode"
              onPress={() => {}}
              iconColor={theme.colors.text.primary}
            />
            <HeaderAction
              icon="person"
              onPress={() => {}}
              iconColor={theme.colors.text.primary}
            />
          </HStack>
        }
        leftIcon="chevron.left"
        onLeftPress={() => {}}
        backgroundColor={theme.colors.background.surface}
      />

      {/* Settings header with back button */}
      <Header
        title="Settings"
        leftIcon="chevron.left"
        onLeftPress={() => {}}
        backgroundColor={theme.colors.background.surface}
      />
    </ScrollView>
  );
});
