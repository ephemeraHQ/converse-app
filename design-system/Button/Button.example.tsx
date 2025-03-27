import { VStack } from "@design-system/VStack"
import { useAppTheme } from "@/theme/use-app-theme"
import { Icon } from "../Icon/Icon"
import { Button } from "./Button"

type IExampleProps = {
  onPress?: () => void
}

export function ButtonExample(args: IExampleProps) {
  const { onPress } = args

  const { theme } = useAppTheme()

  return (
    <VStack
      style={{
        gap: theme.spacing.md,
        backgroundColor: theme.colors.background.raised,
      }}
    >
      {/* Basic Variants */}
      <Button text="Fill Button" variant="fill" onPress={onPress} />
      <Button text="Outline Button" variant="outline" onPress={onPress} />
      <Button text="Link Button" variant="link" onPress={onPress} />

      {/* Sizes */}
      <Button text="Small Button" size="sm" onPress={onPress} />
      {/* <Button text="Medium Button" size="md" onPress={onPress} /> */}
      <Button text="Large Button" size="lg" onPress={onPress} />

      {/* States */}
      <Button text="Loading Button" loading={true} onPress={onPress} />
      {/* <Button text="Disabled Button" disabled={true} onPress={onPress} /> */}

      {/* With Icons */}
      <Button text="Button with Icon" icon="search" onPress={onPress} />

      {/* Custom Accessories */}
      <Button
        size="sm"
        text="Custom Left Accessory"
        LeftAccessory={({ style }) => (
          <Icon
            icon="chevron.left"
            size={theme.iconSize.md}
            color={theme.colors.global.primary}
            style={style}
          />
        )}
        RightAccessory={({ style }) => (
          <Icon
            icon="chevron.right"
            size={theme.iconSize.md}
            color={theme.colors.global.primary}
            style={style}
          />
        )}
        onPress={onPress}
      />

      {/* i18n Example */}
      {/* <Button tx="cancel" txOptions={{ name: "John" }} onPress={onPress} /> */}

      {/* With Haptic Feedback */}
      <Button text="Haptic Button" withHapticFeedback onPress={onPress} />
    </VStack>
  )
}
