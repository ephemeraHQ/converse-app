## SpecStory

## Fixing Component Crash in React (1/10/2025, 11:44:08 AM)

_**User**_

can you find an error herer? When I call this component I have a crash

---

_**Assistant**_

Looking at the code snippets, I notice that the `OnboardingTitle` component has two different versions, and there seems to be an inconsistency in how it handles props and text content.

The issue is likely that in the current version, the component expects text content to be passed as children, but it's not being handled properly. Here's how to fix it:

```typescript:features/onboarding/components/onboarding-title.tsx
import { AnimatedText, IAnimatedTextProps } from "@/design-system/Text";
import { memo } from "react";

type IOnboardingTitleProps = IAnimatedTextProps & {
  children: React.ReactNode;
};

export const OnboardingTitle = memo(function OnboardingTitle(
  props: IOnboardingTitleProps
) {
  const { style, children, ...rest } = props;
  return (
    <AnimatedText
      weight="semiBold"
      size="xxl"
      style={[{ textAlign: "center" }, style]}
      {...rest}
    >
      {children}
    </AnimatedText>
  );
});
```

The fixes include:
1. Added proper type definition that explicitly requires children prop
2. Destructured `children` from props
3. Added children to the AnimatedText component

Now you can use it like this:
```tsx
<OnboardingTitle>Your text here</OnboardingTitle>
```

The crash was likely happening because the component wasn't properly handling the text content that should be displayed. In React Native, text must be wrapped in a Text component (or its variants like AnimatedText), and the content needs to be passed as children.

---

_**User**_

the eror is with pressable-scale

---

_**Assistant**_

Ah, looking at the `PressableScale` component, I notice that `withHaptics` is being destructured from props but it's not defined in the type definition. This would cause TypeScript errors and potential runtime issues.

Here's the fix:

```typescript:design-system/pressable-scale.tsx
// ... existing imports ...

export type IPressableScaleProps = IPressableProps & {
  withHaptics?: boolean;
};

export const PressableScale = memo(function PressableScale(
  props: IPressableScaleProps
) {
  const { withHaptics = false, onPress: onPressProps, style, ...rest } = props;
  // ... rest of the component code ...
});
```

The changes:
1. Added `withHaptics` to the type definition as an optional boolean prop
2. Provided a default value of `false` in the props destructuring

This should resolve the TypeScript error and prevent runtime crashes. The component will now properly type-check the `withHaptics` prop and handle cases where it's not provided.

You can now use it like this:
```tsx
<PressableScale withHaptics>
  {/* children */}
</PressableScale>
```

or without haptics:
```tsx
<PressableScale>
  {/* children */}
</PressableScale>
```

---



---

