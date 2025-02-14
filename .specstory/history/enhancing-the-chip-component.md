## SpecStory

## Enhancing the Chip Component (2/18/2025, 9:09:45 AM)

_**User**_

I'm trying to make my Chip component better what would you do here

---

_**Assistant**_

Here are some suggested improvements for the Chip component:

```typescript:design-system/chip.tsx
import { Avatar } from "@/components/Avatar";
import { Center } from "@/design-system/Center";
import { Text } from "@/design-system/Text";
import { useAppTheme } from "@/theme/useAppTheme";
import React from "react";
import { Pressable, StyleProp, ViewStyle, PressableStateCallbackType } from "react-native";

type ChipProps = {
  name: string;
  avatarUri?: string;
  isSelected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "filled" | "outlined";
};

export function Chip({
  name,
  avatarUri,
  isSelected,
  onPress,
  size = "sm",
  disabled = false,
  leftIcon,
  rightIcon,
  variant = "outlined",
}: ChipProps) {
  const { theme } = useAppTheme();
  const styles = useChipStyles({ variant });

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.$container,
        isSelected && styles.$selectedContainer,
        disabled && styles.$disabledContainer,
        pressed && styles.$pressedContainer,
      ]}
    >
      <Center style={styles.$content}>
        {leftIcon}
        {avatarUri && <Avatar uri={avatarUri} name={name} size={theme.avatarSize.xs} />}
        <Text 
          preset={size === "sm" ? "small" : "body"}
          style={[
            disabled && styles.$disabledText,
            isSelected && styles.$selectedText
          ]}
        >
          {name}
        </Text>
        {rightIcon}
      </Center>
    </Pressable>
  );
}

export function useChipStyles({ variant }: { variant: "filled" | "outlined" }) {
  const { theme } = useAppTheme();

  const $container = {
    borderRadius: theme.spacing.xs,
    borderWidth: variant === "outlined" ? theme.borderWidth.sm : 0,
    borderColor: theme.colors.border.subtle,
    backgroundColor: variant === "outlined" 
      ? theme.colors.background.surface 
      : theme.colors.fill.minimal,
    paddingVertical: theme.spacing.xxs - (variant === "outlined" ? theme.borderWidth.sm * 2 : 0),
    paddingHorizontal: theme.spacing.xs,
  } satisfies StyleProp<ViewStyle>;

  // ... existing code ...

  return {
    constants: {
      chipHeight: $container.paddingVertical * 2 + $content.height,
    },
    $container,
    $selectedContainer: {
      backgroundColor: theme.colors.fill.minimal,
      borderColor: variant === "outlined" ? theme.colors.fill.minimal : "transparent",
    },
    $content,
    $disabledContainer: {
      opacity: 0.5,
    },
    $pressedContainer: {
      opacity: 0.8,
    },
    $disabledText: {
      color: theme.colors.text.muted,
    },
    $selectedText: {
      color: theme.colors.text.accent,
    },
  } as const;
}
```

Key improvements:

1. Added `disabled` state with visual feedback
2. Added press state feedback
3. Added support for `leftIcon` and `rightIcon` for more flexibility
4. Made avatar optional (only renders when `avatarUri` is provided)
5. Added `variant` prop to support both outlined and filled styles
6. Added text color changes for selected and disabled states
7. Improved type safety with more specific props

You might also want to consider:

1. Adding loading state
2. Adding different color variants (success, error, warning)
3. Adding `onLongPress` handler
4. Adding haptic feedback
5. Adding animation for state changes
6. Adding `maxWidth` and text truncation handling

Let me know if you want me to implement any of these additional features.

---

_**User**_

the problem i see here is i don't like having props like "name" and "avatarUri" for example... I feel that then the chip become less reuable... Like I hate adding optional props. So I thought just putting children and letting parent decide of children, but then i'm also not sure because i want to make sure the text inside is dependant on the size of the chip you know

---

_**Assistant**_

Good point. Here's a more flexible approach that maintains control over text sizing:

```typescript:design-system/chip.tsx
type ChipProps = {
  children: React.ReactNode;
  isSelected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
  variant?: "filled" | "outlined";
};

export function Chip({
  children,
  isSelected,
  onPress,
  size = "sm",
  disabled = false,
  variant = "outlined",
}: ChipProps) {
  const { theme } = useAppTheme();
  const styles = useChipStyles({ variant });

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.$container,
        isSelected && styles.$selectedContainer,
        disabled && styles.$disabledContainer,
        pressed && styles.$pressedContainer,
      ]}
    >
      <Center style={styles.$content}>
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && child.type === Text) {
            return React.cloneElement(child, {
              preset: size === "sm" ? "small" : "body",
              style: [
                child.props.style,
                disabled && styles.$disabledText,
                isSelected && styles.$selectedText
              ]
            });
          }
          return child;
        })}
      </Center>
    </Pressable>
  );
}

// Usage examples:
<Chip size="sm">
  <Avatar uri={avatarUri} name={name} size="xs" />
  <Text>{name}</Text>
</Chip>

<Chip size="md">
  <Icon name="star" />
  <Text>Starred</Text>
  <Badge count={5} />
</Chip>
```

This approach:
1. Makes the Chip more flexible - can contain any components
2. Still enforces text sizing based on the chip size
3. Removes specific props like `name` and `avatarUri`
4. Allows for more complex layouts while maintaining consistency
5. Parent has full control over the content while Chip maintains control over styling

The component automatically handles Text components by applying the correct preset based on size, while leaving other components untouched.

---

_**User**_

is there other ways ?

---

_**Assistant**_

Yes, here's another approach using a compound component pattern, which gives you more control and better type safety:

```typescript:design-system/chip.tsx
type ChipProps = {
  isSelected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
  variant?: "filled" | "outlined";
  children: React.ReactNode;
};

type ChipTextProps = {
  children: string;
  style?: StyleProp<TextStyle>;
};

type ChipIconProps = {
  children: React.ReactNode;
};

export function Chip({ children, isSelected, onPress, size = "sm", disabled, variant = "outlined" }: ChipProps) {
  const { theme } = useAppTheme();
  const styles = useChipStyles({ variant });

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.$container,
        isSelected && styles.$selectedContainer,
        disabled && styles.$disabledContainer,
        pressed && styles.$pressedContainer,
      ]}
    >
      <Center style={styles.$content}>
        {children}
      </Center>
    </Pressable>
  );
}

// Subcomponents
Chip.Text = function ChipText({ children, style }: ChipTextProps) {
  const { size, disabled, isSelected } = useChipContext();
  const styles = useChipStyles({ variant: "outlined" }); // variant doesn't matter for text

  return (
    <Text
      preset={size === "sm" ? "small" : "body"}
      style={[
        style,
        disabled && styles.$disabledText,
        isSelected && styles.$selectedText
      ]}
    >
      {children}
    </Text>
  );
};

Chip.Icon = function ChipIcon({ children }: ChipIconProps) {
  return children;
};

// Usage:
<Chip size="sm" isSelected>
  <Chip.Icon>
    <Avatar uri={avatarUri} name={name} size="xs" />
  </Chip.Icon>
  <Chip.Text>{name}</Chip.Text>
</Chip>

<Chip size="md">
  <Chip.Icon>
    <StarIcon />
  </Chip.Icon>
  <Chip.Text>Starred</Chip.Text>
  <Chip.Icon>
    <Badge count={5} />
  </Chip.Icon>
</Chip>
```

Benefits of this approach:
1. Type-safe subcomponents
2. Clear API for what goes inside a Chip
3. Better control over styling of specific parts
4. No need for React.Children manipulation
5. Better IDE support and autocompletion
6. More explicit about what kind of content is allowed

You'll need to add a ChipContext to share the size/disabled/selected state with subcomponents:

```typescript
type ChipContextType = {
  size: "sm" | "md";
  disabled?: boolean;
  isSelected?: boolean;
};

const ChipContext = React.createContext<ChipContextType | null>(null);

function useChipContext() {
  const context = React.useContext(ChipContext);
  if (!context) {
    throw new Error("Chip subcomponents must be used within a Chip");
  }
  return context;
}
```

Let me know if you want me to show the full implementation with the context.

---

_**User**_

is there another way without having to have a context?

---

_**Assistant**_

Yes, here's a simpler approach using render props pattern:

```typescript:design-system/chip.tsx
type ChipProps = {
  isSelected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
  variant?: "filled" | "outlined";
  renderIcon?: () => React.ReactNode;
  renderText: (textProps: { 
    preset: "small" | "body";
    style: StyleProp<TextStyle>;
  }) => React.ReactNode;
};

export function Chip({ 
  isSelected,
  onPress,
  size = "sm",
  disabled,
  variant = "outlined",
  renderIcon,
  renderText,
}: ChipProps) {
  const { theme } = useAppTheme();
  const styles = useChipStyles({ variant });

  const textProps = {
    preset: size === "sm" ? "small" : "body",
    style: [
      disabled && styles.$disabledText,
      isSelected && styles.$selectedText
    ]
  } as const;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.$container,
        isSelected && styles.$selectedContainer,
        disabled && styles.$disabledContainer,
        pressed && styles.$pressedContainer,
      ]}
    >
      <Center style={styles.$content}>
        {renderIcon?.()}
        {renderText(textProps)}
      </Center>
    </Pressable>
  );
}

// Usage:
<Chip
  size="sm"
  renderIcon={() => <Avatar uri={avatarUri} name={name} size="xs" />}
  renderText={(textProps) => <Text {...textProps}>{name}</Text>}
/>

<Chip
  size="md"
  renderIcon={() => <StarIcon />}
  renderText={(textProps) => <Text {...textProps}>Starred</Text>}
/>
```

Benefits:
1. No context needed
2. No subcomponents
3. Still maintains control over text styling
4. Type-safe
5. More flexible than the original approach
6. Simpler implementation

The tradeoff is slightly more verbose usage, but it's more explicit about what's happening. Let me know if you want to see other patterns!

---

_**User**_

no i don't like the renderText, etc... I prefer your Chip.Text pattern

---

_**Assistant**_

You're right - let's go back to the compound component pattern but without context. We can pass the needed props directly to the subcomponents:

```typescript:design-system/chip.tsx
type ChipProps = {
  isSelected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
  variant?: "filled" | "outlined";
  children: React.ReactNode;
};

type ChipTextProps = {
  children: string;
  style?: StyleProp<TextStyle>;
  size?: "sm" | "md";
  disabled?: boolean;
  isSelected?: boolean;
};

type ChipIconProps = {
  children: React.ReactNode;
};

export function Chip({ 
  children, 
  isSelected, 
  onPress, 
  size = "sm", 
  disabled, 
  variant = "outlined" 
}: ChipProps) {
  const styles = useChipStyles({ variant });

  // Clone children to pass size/disabled/selected props
  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type === ChipText) {
      return React.cloneElement(child, { size, disabled, isSelected });
    }
    return child;
  });

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.$container,
        isSelected && styles.$selectedContainer,
        disabled && styles.$disabledContainer,
        pressed && styles.$pressedContainer,
      ]}
    >
      <Center style={styles.$content}>
        {enhancedChildren}
      </Center>
    </Pressable>
  );
}

function ChipText({ children, style, size = "sm", disabled, isSelected }: ChipTextProps) {
  const styles = useChipStyles({ variant: "outlined" });

  return (
    <Text
      preset={size === "sm" ? "small" : "body"}
      style={[
        style,
        disabled && styles.$disabledText,
        isSelected && styles.$selectedText
      ]}
    >
      {children}
    </Text>
  );
}

function ChipIcon({ children }: ChipIconProps) {
  return children;
}

Chip.Text = ChipText;
Chip.Icon = ChipIcon;

// Usage:
<Chip size="sm" isSelected>
  <Chip.Icon>
    <Avatar uri={uri} name={name} size="xs" />
  </Chip.Icon>
  <Chip.Text>{name}</Chip.Text>
</Chip>
```

This approach:
1. No context needed
2. Clean, declarative API
3. Type-safe subcomponents
4. Maintains control over text styling
5. Simpler implementation than context
6. More flexible than render props

The main tradeoff is that we're passing props through React.Children.map, but it's a common pattern and works well here.

---

_**User**_

what if the children already have a "size" props. what will happen?

---

_**Assistant**_

Ah good catch! Currently there would be a prop collision. When we clone the element and pass size, it would override any existing size prop on the children. 

Here's a safer approach that preserves the original props:

```typescript:design-system/chip.tsx
type ChipTextProps = {
  children: string;
  style?: StyleProp<TextStyle>;
  chipSize?: "sm" | "md"; // renamed from size to chipSize
  chipDisabled?: boolean; // renamed from disabled to chipDisabled 
  chipSelected?: boolean; // renamed from isSelected to chipSelected
};

export function Chip({ 
  children, 
  isSelected, 
  onPress, 
  size = "sm", 
  disabled, 
  variant = "outlined" 
}: ChipProps) {
  const styles = useChipStyles({ variant });

  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type === ChipText) {
      return React.cloneElement(child, {
        chipSize: size,
        chipDisabled: disabled,
        chipSelected: isSelected,
        ...child.props // preserve original props
      });
    }
    return child;
  });

  // ... rest of component
}

function ChipText({ 
  children, 
  style, 
  chipSize = "sm",
  chipDisabled,
  chipSelected,
  ...props // allow other props to pass through
}: ChipTextProps) {
  const styles = useChipStyles({ variant: "outlined" });

  return (
    <Text
      preset={chipSize === "sm" ? "small" : "body"}
      style={[
        style,
        chipDisabled && styles.$disabledText,
        chipSelected && styles.$selectedText
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

// Usage stays clean:
<Chip size="sm" isSelected>
  <Chip.Icon>
    <Avatar size="xs" /> {/* Avatar's size prop is preserved */}
  </Chip.Icon>
  <Chip.Text size="lg">{name}</Chip.Text> {/* Text can have its own size prop */}
</Chip>
```

This way:
1. No prop collisions
2. Clear separation between Chip's control props and child component props
3. More explicit about which props are coming from the Chip component
4. Children can have their own props without interference

---

_**User**_

here's some code of a button component that has the same kind of composable pattern. It uses different styling pattern and stuff but don't look about those. Just look at how they manage the size problem we're facing when let's say the Chip componet has size="sm" we want the Chip.Text to also know about that size.

"use client"

import React, { useCallback, useMemo } from "react"
import { createButton } from "@gluestack-ui/button"
import { Svg } from "react-native-svg"
import type { GestureResponderEvent, PressableProps } from "react-native"
import { tva } from "@gluestack-ui/nativewind-utils/tva"
import {
  withStyleContext,
  useStyleContext,
} from "@gluestack-ui/nativewind-utils/withStyleContext"
import { withStyleContextAndStates } from "@gluestack-ui/nativewind-utils/withStyleContextAndStates"
import { cssInterop } from "nativewind"
import { withStates } from "@gluestack-ui/nativewind-utils/withStates"
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  Platform,
} from "react-native"
import type { VariantProps } from "@gluestack-ui/nativewind-utils"
import { usePressInDepth } from "../../../hooks/use-pressed-scale"
import { Haptics } from "../../../utils/haptics"
import Animated from "react-native-reanimated"

const SCOPE = "BUTTON"
const ButtonWrapper = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  PressableProps
>(({ ...props }, ref) => {
  return (
    <Pressable
      {...props}
      ref={ref}
    />
  )
})

type IPrimitiveIcon = React.ComponentPropsWithoutRef<typeof Svg> & {
  height?: number | string
  width?: number | string
  fill?: string
  color?: string
  size?: number | string
  stroke?: string
  as?: React.ElementType
}
const PrimitiveIcon = React.forwardRef(
  (
    {
      height,
      width,
      fill,
      color,
      size,
      stroke = "currentColor",
      as: AsComp,
      ...props
    }: IPrimitiveIcon,
    ref: React.Ref<Svg>
  ) => {
    const sizeProps = useMemo(() => {
      if (size) return { size }
      if (height && width) return { height, width }
      if (height) return { height }
      if (width) return { width }
      return {}
    }, [size, height, width])

    const colorProps =
      stroke === "currentColor" && color !== undefined ? color : stroke

    if (AsComp) {
      return (
        <AsComp
          ref={ref}
          fill={fill}
          {...props}
          {...sizeProps}
          stroke={colorProps}
        />
      )
    }
    return (
      <Svg
        ref={ref}
        height={height}
        width={width}
        fill={fill}
        stroke={colorProps}
        {...props}
      />
    )
  }
)

const Root =
  Platform.OS === "web"
    ? withStyleContext(ButtonWrapper, SCOPE)
    : withStyleContextAndStates(ButtonWrapper, SCOPE)

const UIButton = createButton({
  Root: Root,
  Text,
  Group: View,
  Spinner: ActivityIndicator,
  Icon: withStates(PrimitiveIcon),
})

const AnimatedUIButton = Animated.createAnimatedComponent(UIButton)

cssInterop(Root, { className: "style" })
cssInterop(UIButton.Text, { className: "style" })
cssInterop(UIButton.Group, { className: "style" })
cssInterop(UIButton.Spinner, {
  className: { target: "style", nativeStyleToProp: { color: true } },
})

cssInterop(PrimitiveIcon, {
  className: {
    target: "style",
    nativeStyleToProp: {
      height: true,
      width: true,
      // @ts-ignore
      fill: true,
      color: true,
      stroke: true,
    },
  },
})

const buttonStyle = tva({
  base: "group/button rounded bg-primary-500 flex-row items-center justify-center data-[focus-visible=true]:web:outline-none data-[focus-visible=true]:web:ring-2 data-[disabled=true]:opacity-40",
  variants: {
    action: {
      primary:
        "bg-primary-500 data-[hover=true]:bg-primary-600 data-[active=true]:bg-primary-700 border-primary-300 data-[hover=true]:border-primary-400 data-[active=true]:border-primary-500 data-[focus-visible=true]:web:ring-indicator-info",
      secondary:
        "bg-secondary-500 border-secondary-300 data-[hover=true]:bg-secondary-600 data-[hover=true]:border-secondary-400 data-[active=true]:bg-secondary-700 data-[active=true]:border-secondary-500 data-[focus-visible=true]:web:ring-indicator-info",
      positive:
        "bg-success-500 border-success-300 data-[hover=true]:bg-success-600 data-[hover=true]:border-success-400 data-[active=true]:bg-success-700 data-[active=true]:border-success-500 data-[focus-visible=true]:web:ring-indicator-info",
      negative:
        "bg-error-500 border-error-300 data-[hover=true]:bg-error-600 data-[hover=true]:border-error-400 data-[active=true]:bg-error-700 data-[active=true]:border-error-500 data-[focus-visible=true]:web:ring-indicator-info",
      default:
        "bg-transparent data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent",
    },
    variant: {
      link: "px-0",
      outline:
        "bg-transparent border data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent",
      solid: "",
    },

    size: {
      xs: "px-3.5 h-8",
      sm: "px-4 h-9",
      md: "px-5 h-10",
      lg: "px-6 h-11",
      xl: "px-7 h-12",
    },
  },
  compoundVariants: [
    {
      action: "primary",
      variant: "link",
      class:
        "px-0 bg-transparent data-[hover=true]:bg-transparent data-[active=true]:bg-transparent",
    },
    {
      action: "secondary",
      variant: "link",
      class:
        "px-0 bg-transparent data-[hover=true]:bg-transparent data-[active=true]:bg-transparent",
    },
    {
      action: "positive",
      variant: "link",
      class:
        "px-0 bg-transparent data-[hover=true]:bg-transparent data-[active=true]:bg-transparent",
    },
    {
      action: "negative",
      variant: "link",
      class:
        "px-0 bg-transparent data-[hover=true]:bg-transparent data-[active=true]:bg-transparent",
    },
    {
      action: "primary",
      variant: "outline",
      class:
        "bg-transparent data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent",
    },
    {
      action: "secondary",
      variant: "outline",
      class:
        "bg-transparent data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent",
    },
    {
      action: "positive",
      variant: "outline",
      class:
        "bg-transparent data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent",
    },
    {
      action: "negative",
      variant: "outline",
      class:
        "bg-transparent data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent",
    },
  ],
})

const buttonTextStyle = tva({
  base: "text-typography-0 font-semibold web:select-none",
  parentVariants: {
    action: {
      primary:
        "text-primary-600 data-[hover=true]:text-primary-600 data-[active=true]:text-primary-700",
      secondary:
        "text-secondary-600 data-[hover=true]:text-secondary-600 data-[active=true]:text-secondary-700",
      positive:
        "text-success-600 data-[hover=true]:text-success-600 data-[active=true]:text-success-700",
      negative:
        "text-error-600 data-[hover=true]:text-error-600 data-[active=true]:text-error-700",
    },
    variant: {
      link: "data-[hover=true]:underline data-[active=true]:underline",
      outline: "",
      solid:
        "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
  },
  parentCompoundVariants: [
    {
      variant: "solid",
      action: "primary",
      class:
        "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0",
    },
    {
      variant: "solid",
      action: "secondary",
      class:
        "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0",
    },
    {
      variant: "solid",
      action: "positive",
      class:
        "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0",
    },
    {
      variant: "solid",
      action: "negative",
      class:
        "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0",
    },
    {
      variant: "outline",
      action: "primary",
      class:
        "text-primary-500 data-[hover=true]:text-primary-500 data-[active=true]:text-primary-500",
    },
    {
      variant: "outline",
      action: "secondary",
      class:
        "text-primary-500 data-[hover=true]:text-primary-500 data-[active=true]:text-primary-500",
    },
    {
      variant: "outline",
      action: "positive",
      class:
        "text-primary-500 data-[hover=true]:text-primary-500 data-[active=true]:text-primary-500",
    },
    {
      variant: "outline",
      action: "negative",
      class:
        "text-primary-500 data-[hover=true]:text-primary-500 data-[active=true]:text-primary-500",
    },
  ],
})

const buttonIconStyle = tva({
  base: "fill-none",
  parentVariants: {
    variant: {
      link: "data-[hover=true]:underline data-[active=true]:underline",
      outline: "",
      solid:
        "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0",
    },
    size: {
      xs: "h-3.5 w-3.5",
      sm: "h-4 w-4",
      md: "h-[18px] w-[18px]",
      lg: "h-[18px] w-[18px]",
      xl: "h-5 w-5",
    },
    action: {
      primary:
        "text-primary-600 data-[hover=true]:text-primary-600 data-[active=true]:text-primary-700",
      secondary:
        "text-secondary-600 data-[hover=true]:text-secondary-600 data-[active=true]:text-secondary-700",
      positive:
        "text-success-600 data-[hover=true]:text-success-600 data-[active=true]:text-success-700",

      negative:
        "text-error-600 data-[hover=true]:text-error-600 data-[active=true]:text-error-700",
    },
  },
  parentCompoundVariants: [
    {
      variant: "solid",
      action: "primary",
      class:
        "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0",
    },
    {
      variant: "solid",
      action: "secondary",
      class:
        "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0",
    },
    {
      variant: "solid",
      action: "positive",
      class:
        "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0",
    },
    {
      variant: "solid",
      action: "negative",
      class:
        "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0",
    },
  ],
})

const buttonGroupStyle = tva({
  base: "",
  variants: {
    space: {
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
      xl: "gap-5",
      "2xl": "gap-6",
      "3xl": "gap-7",
      "4xl": "gap-8",
    },
    isAttached: {
      true: "gap-0",
    },
  },
})

type IButtonProps = Omit<
  React.ComponentPropsWithoutRef<typeof UIButton>,
  "context"
> &
  VariantProps<typeof buttonStyle> & { className?: string } & {
    withHaptics?: boolean
  }

const Button = React.forwardRef<
  React.ElementRef<typeof UIButton>,
  IButtonProps
>(
  (
    {
      className,
      variant = "solid",
      size = "md",
      action = "primary",
      onPress: onPressProps,
      withHaptics = true,
      style,
      ...props
    },
    ref
  ) => {
    const { handlePressIn, handlePressOut, animatedStyle } = usePressInDepth({
      withHapticFeedback: withHaptics,
    })

    const handlePress = useCallback(
      (e: GestureResponderEvent) => {
        if (withHaptics) {
          Haptics.lightImpactAsync()
        }
        if (onPressProps) {
          onPressProps(e)
        }
      },
      [onPressProps, withHaptics]
    )

    return (
      <AnimatedUIButton
        ref={ref}
        {...props}
        style={[style, animatedStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        className={buttonStyle({ variant, size, action, class: className })}
        context={{ variant, size, action }}
      />
    )
  }
)

type IButtonTextProps = React.ComponentPropsWithoutRef<typeof UIButton.Text> &
  VariantProps<typeof buttonTextStyle> & { className?: string }

const ButtonText = React.forwardRef<
  React.ElementRef<typeof UIButton.Text>,
  IButtonTextProps
>(({ className, variant, size, action, ...props }, ref) => {
  const {
    variant: parentVariant,
    size: parentSize,
    action: parentAction,
  } = useStyleContext(SCOPE)

  return (
    <UIButton.Text
      ref={ref}
      {...props}
      className={buttonTextStyle({
        parentVariants: {
          variant: parentVariant,
          size: parentSize,
          action: parentAction,
        },
        variant,
        size,
        action,
        class: className,
      })}
    />
  )
})

const ButtonSpinner = UIButton.Spinner

type IButtonIcon = React.ComponentPropsWithoutRef<typeof UIButton.Icon> &
  VariantProps<typeof buttonIconStyle> & {
    className?: string | undefined
    as?: React.ElementType
  }

const ButtonIcon = React.forwardRef<
  React.ElementRef<typeof UIButton.Icon>,
  IButtonIcon
>(({ className, size, ...props }, ref) => {
  const {
    variant: parentVariant,
    size: parentSize,
    action: parentAction,
  } = useStyleContext(SCOPE)

  if (typeof size === "number") {
    return (
      <UIButton.Icon
        ref={ref}
        {...props}
        className={buttonIconStyle({ class: className })}
        size={size}
      />
    )
  } else if (
    (props.height !== undefined || props.width !== undefined) &&
    size === undefined
  ) {
    return (
      <UIButton.Icon
        ref={ref}
        {...props}
        className={buttonIconStyle({ class: className })}
      />
    )
  }
  return (
    <UIButton.Icon
      {...props}
      className={buttonIconStyle({
        parentVariants: {
          size: parentSize,
          variant: parentVariant,
          action: parentAction,
        },
        size,
        class: className,
      })}
      ref={ref}
    />
  )
})

type IButtonGroupProps = React.ComponentPropsWithoutRef<typeof UIButton.Group> &
  VariantProps<typeof buttonGroupStyle>

const ButtonGroup = React.forwardRef<
  React.ElementRef<typeof UIButton.Group>,
  IButtonGroupProps
>(({ className, space = "md", isAttached = false, ...props }, ref) => {
  return (
    <UIButton.Group
      className={buttonGroupStyle({ class: className, space, isAttached })}
      {...props}
      ref={ref}
    />
  )
})

Button.displayName = "Button"
ButtonText.displayName = "ButtonText"
ButtonSpinner.displayName = "ButtonSpinner"
ButtonIcon.displayName = "ButtonIcon"
ButtonGroup.displayName = "ButtonGroup"

export { Button, ButtonText, ButtonSpinner, ButtonIcon, ButtonGroup }


---

_**Assistant**_

I see - they're using a context-based approach with `useStyleContext` to share style props between the parent and child components. Here's how we can adapt this pattern for our Chip:

```typescript:design-system/chip.tsx
import React from "react";
import { Pressable, StyleProp, ViewStyle, TextStyle } from "react-native";

const ChipContext = React.createContext<{
  size: "sm" | "md";
  disabled?: boolean;
  isSelected?: boolean;
} | null>(null);

function useChipContext() {
  const context = React.useContext(ChipContext);
  if (!context) {
    throw new Error("Chip.* components must be used within a Chip component");
  }
  return context;
}

type ChipProps = {
  isSelected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
  variant?: "filled" | "outlined";
  children: React.ReactNode;
};

export function Chip({ 
  children, 
  isSelected, 
  onPress, 
  size = "sm", 
  disabled, 
  variant = "outlined" 
}: ChipProps) {
  const styles = useChipStyles({ variant });

  return (
    <ChipContext.Provider value={{ size, disabled, isSelected }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.$container,
          isSelected && styles.$selectedContainer,
          disabled && styles.$disabledContainer,
          pressed && styles.$pressedContainer,
        ]}
      >
        <Center style={styles.$content}>
          {children}
        </Center>
      </Pressable>
    </ChipContext.Provider>
  );
}

type ChipTextProps = {
  children: string;
  style?: StyleProp<TextStyle>;
};

function ChipText({ children, style }: ChipTextProps) {
  const { size, disabled, isSelected } = useChipContext();
  const styles = useChipStyles({ variant: "outlined" });

  return (
    <Text
      preset={size === "sm" ? "small" : "body"}
      style={[
        style,
        disabled && styles.$disabledText,
        isSelected && styles.$selectedText
      ]}
    >
      {children}
    </Text>
  );
}

function ChipIcon({ children }: { children: React.ReactNode }) {
  return children;
}

Chip.Text = ChipText;
Chip.Icon = ChipIcon;

// Usage stays the same:
<Chip size="sm" isSelected>
  <Chip.Icon>
    <Avatar size={theme.avatarSize.xs} />
  </Chip.Icon>
  <Chip.Text>Name</Chip.Text>
</Chip>
```

Key differences:
1. Uses React Context instead of prop cloning
2. Cleaner separation of concerns
3. Better type safety
4. No need to worry about prop collisions
5. Child components can access parent props without prop drilling
6. More performant than cloning elements

The context approach is what most component libraries use (like the Button example you shared) because it's more maintainable and scalable.

---

_**User**_

add Chip.Avatar

---

_**Assistant**_

Here's how to add Chip.Avatar with proper sizing based on the chip's context:

```typescript:design-system/chip.tsx
// Add this type
type ChipAvatarProps = {
  uri?: string;
  name: string;
};

// Add this component
function ChipAvatar({ uri, name }: ChipAvatarProps) {
  const { size } = useChipContext();
  const { theme } = useAppTheme();

  // You could also make this mapping more sophisticated if needed
  const avatarSize = theme.avatarSize.xs;

  return <Avatar uri={uri} name={name} size={avatarSize} />;
}

// Add to Chip component
Chip.Avatar = ChipAvatar;

// Usage example:
{/* 
<Chip size="sm">
  <Chip.Avatar uri={avatarUri} name={name} />
  <Chip.Text>{name}</Chip.Text>
</Chip>
*/}
```

This approach:
1. Uses context to access the chip's size
2. Keeps avatar sizing consistent
3. Simplifies the API - no need to manually specify avatar size
4. Type-safe props
5. Consistent with the rest of the compound component pattern

You might also want to add error boundaries and prop-types validation, but this is the core implementation.

---

_**User**_

is there a cleaner way to do this like maybe do export const Chip = { Text, Icon, ... }??

---

_**Assistant**_

Yes! Here's a cleaner way to organize the Chip component using object composition:

```typescript:design-system/chip.tsx
// Root component
function ChipRoot({ 
  children, 
  isSelected, 
  onPress, 
  size = "sm", 
  disabled, 
  variant = "outlined" 
}: ChipProps) {
  const styles = useChipStyles({ variant });

  return (
    <ChipContext.Provider value={{ size, disabled, isSelected }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.$container,
          isSelected && styles.$selectedContainer,
          disabled && styles.$disabledContainer,
          pressed && styles.$pressedContainer,
        ]}
      >
        <Center style={styles.$content}>{children}</Center>
      </Pressable>
    </ChipContext.Provider>
  );
}

// Subcomponents
function Text({ children, style, ...props }: ChipTextProps) {
  const { size, disabled, isSelected } = useChipContext();
  const styles = useChipStyles({ variant: "outlined" });

  return (
    <Text
      preset={size === "sm" ? "small" : "body"}
      style={[
        style,
        disabled && styles.$disabledText,
        isSelected && styles.$selectedText,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

function Icon({ children }: ChipIconProps) {
  return children;
}

function Avatar({ uri, name }: ChipAvatarProps) {
  const { theme } = useAppTheme();
  return <Avatar uri={uri} name={name} size={theme.avatarSize.xs} />;
}

// Export composed component
export const Chip = Object.assign(ChipRoot, {
  Text,
  Icon,
  Avatar,
});

// Usage:
{/* 
<Chip size="sm">
  <Chip.Avatar uri={avatarUri} name={name} />
  <Chip.Text>{name}</Chip.Text>
</Chip>
*/}
```

This approach:
1. Cleaner organization - all components are defined as regular functions
2. More explicit composition using Object.assign
3. Better TypeScript inference
4. Easier to add new subcomponents
5. Still maintains all the context and type safety benefits
6. More idiomatic React pattern

The `Object.assign` pattern is used by many popular React libraries like React Table, React Query, etc.

---

_**User**_

maybe do like the example i shared like export {Chip, ChipText, ChipAvatar, ChipIcon} 

---

_**Assistant**_



Yes! That's a cleaner approach. Here's how we can restructure it:

```typescript:design-system/chip.tsx
import { Avatar as RNAvatar } from "@/components/Avatar";
import { Center } from "@/design-system/Center";
import { Text as RNText } from "@/design-system/Text";
import { useAppTheme } from "@/theme/useAppTheme";
import React from "react";
import {
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";

const ChipContext = React.createContext<{
  size: "sm" | "md";
  disabled?: boolean;
  isSelected?: boolean;
} | null>(null);

function useChipContext() {
  const context = React.useContext(ChipContext);
  if (!context) {
    throw new Error("Chip components must be used within a Chip");
  }
  return context;
}

type ChipProps = {
  isSelected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
  variant?: "filled" | "outlined";
  children: React.ReactNode;
};

export function Chip({ 
  children, 
  isSelected, 
  onPress, 
  size = "sm", 
  disabled, 
  variant = "outlined" 
}: ChipProps) {
  const styles = useChipStyles({ variant });

  return (
    <ChipContext.Provider value={{ size, disabled, isSelected }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.$container,
          isSelected && styles.$selectedContainer,
          disabled && styles.$disabledContainer,
          pressed && styles.$pressedContainer,
        ]}
      >
        <Center style={styles.$content}>{children}</Center>
      </Pressable>
    </ChipContext.Provider>
  );
}

type ChipTextProps = {
  children: string;
  style?: StyleProp<TextStyle>;
};

export function ChipText({ children, style }: ChipTextProps) {
  const { size, disabled, isSelected } = useChipContext();
  const styles = useChipStyles({ variant: "outlined" });

  return (
    <RNText
      preset={size === "sm" ? "small" : "body"}
      style={[
        style,
        disabled && styles.$disabledText,
        isSelected && styles.$selectedText,
      ]}
    >
      {children}
    </RNText>
  );
}

type ChipIconProps = {
  children: React.ReactNode;
};

export function ChipIcon({ children }: ChipIconProps) {
  return children;
}

type ChipAvatarProps = {
  uri?: string;
  name: string;
};

export function ChipAvatar({ uri, name }: ChipAvatarProps) {
  const { theme } = useAppTheme();
  return <RNAvatar uri={uri} name={name} size={theme.avatarSize.xs} />;
}

// Usage:
{/* 
<Chip size="sm">
  <ChipAvatar uri={avatarUri} name={name} />
  <ChipText>{name}</ChipText>
</Chip>
*/}

// ... rest of the styles code
```

Key changes:
1. Renamed imported components to avoid naming conflicts
2. Export each component individually
3. Simpler imports/exports pattern
4. More consistent with the Button example you shared
5. Removed unnecessary props from ChipTextProps
6. Cleaner overall structure

The usage is slightly different but more explicit:
```tsx
import { Chip, ChipText, ChipAvatar, ChipIcon } from "@/design-system/chip";

<Chip size="sm">
  <ChipAvatar uri={avatarUri} name={name} />
  <ChipText>{name}</ChipText>
</Chip>
```

---



---

