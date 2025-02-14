## SpecStory

## Onboarding Component Structure Update (10/2/2024, 1:16:08 PM)

_**User**_

I want to reuse the component in here but named Onboarding at the beginning. I do that because I'll add specififc style

import Picto from "@components/Picto";
import { AnimatedText, IAnimatedTextProps } from "@design-system/Text";
import { ITitleProps, Title } from "@design-system/Title";
import { AnimatedVStack, IAnimatedVStackProps } from "@design-system/VStack";
import { spacing } from "@theme/spacing";
import React from "react";

import { IPictoProps } from "./Picto/Picto";

export function SubtitleComponent({ style, ...rest }: IAnimatedTextProps) {
  return (
    <AnimatedText
      preset="subheading"
      style={[{ textAlign: "center" }, style]}
      {...rest}
    />
  );
}

export function TitleComponent({ style, ...rest }: ITitleProps) {
  return <Title style={[{ textAlign: "center" }, style]} {...rest} />;
}

export function ContainerComponent({
  children,
  style,
  ...props
}: IAnimatedVStackProps) {
  return (
    <AnimatedVStack
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          rowGap: spacing.xs,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </AnimatedVStack>
  );
}

export function PictoComponent(props: IPictoProps) {
  return <Picto style={{ height: props.size }} {...props} />;
}

export const PictoTitleSubtitle = {
  Subtitle: SubtitleComponent,
  Title: TitleComponent,
  Container: ContainerComponent,
  Picto: PictoComponent,
};


---

_**Assistant**_

Certainly! I understand that you want to reuse the component but with "Onboarding" at the beginning of the name. Here's how you can modify the file to achieve that:

```typescript:components/Onboarding/OnboardingPictoTitleSubtitle.tsx
import Picto from "@components/Picto";
import { AnimatedText, IAnimatedTextProps } from "@design-system/Text";
import { ITitleProps, Title } from "@design-system/Title";
import { AnimatedVStack, IAnimatedVStackProps } from "@design-system/VStack";
import { spacing } from "@theme/spacing";
import React from "react";

import { IPictoProps } from "./Picto/Picto";

// ... existing code ...

export const OnboardingPictoTitleSubtitle = {
  Subtitle: SubtitleComponent,
  Title: TitleComponent,
  Container: ContainerComponent,
  Picto: PictoComponent,
};
```

The main change here is renaming the exported object from `PictoTitleSubtitle` to `OnboardingPictoTitleSubtitle`. This allows you to use the component with the "Onboarding" prefix while maintaining the same structure and subcomponents.

Now you can import and use this component in other parts of your application like this:

```typescript
import { OnboardingPictoTitleSubtitle } from "@components/Onboarding/OnboardingPictoTitleSubtitle";

// Usage
<OnboardingPictoTitleSubtitle.Container>
  <OnboardingPictoTitleSubtitle.Picto ... />
  <OnboardingPictoTitleSubtitle.Title ... />
  <OnboardingPictoTitleSubtitle.Subtitle ... />
</OnboardingPictoTitleSubtitle.Container>
```

This change allows you to add specific styles or behavior for the onboarding version of this component if needed, while still reusing the existing structure and subcomponents.

---

_**User**_

but I want to add a marginBottom to the container style

---

_**Assistant**_

Certainly! I'll modify the `ContainerComponent` to include a `marginBottom` in its style. Here's the updated version:

```typescript:components/Onboarding/OnboardingPictoTitleSubtitle.tsx
// ... existing imports ...

export function ContainerComponent({
  children,
  style,
  ...props
}: IAnimatedVStackProps) {
  return (
    <AnimatedVStack
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          rowGap: spacing.xs,
          marginBottom: spacing.xl, // Added marginBottom
        },
        style,
      ]}
      {...props}
    >
      {children}
    </AnimatedVStack>
  );
}

// ... other components ...

export const OnboardingPictoTitleSubtitle = {
  Subtitle: SubtitleComponent,
  Title: TitleComponent,
  Container: ContainerComponent,
  Picto: PictoComponent,
};
```

In this update, I've added `marginBottom: spacing.xl` to the default styles of the `ContainerComponent`. I've used `spacing.xl` as an example, but you can adjust this value to whatever spacing you prefer (e.g., `spacing.md`, `spacing.xxl`, or a specific number).

This change will add a bottom margin to the container when used in the onboarding context. The `style` prop passed to the component will still be applied after this default style, so you can override or add to this margin if needed when using the component.

---

_**User**_

But reuse PictoTitleSubtitle.Container

---

_**Assistant**_

I understand. You want to reuse the existing `PictoTitleSubtitle.Container` component but add a specific `marginBottom` for the onboarding version. Here's how we can achieve that:

```typescript:components/Onboarding/OnboardingPictoTitleSubtitle.tsx
import Picto from "@components/Picto";
import { AnimatedText, IAnimatedTextProps } from "@design-system/Text";
import { ITitleProps, Title } from "@design-system/Title";
import { AnimatedVStack, IAnimatedVStackProps } from "@design-system/VStack";
import { spacing } from "@theme/spacing";
import React from "react";

import { IPictoProps } from "./Picto/Picto";
import { PictoTitleSubtitle } from "./PictoTitleSubtitle";

export function OnboardingContainerComponent({
  children,
  style,
  ...props
}: IAnimatedVStackProps) {
  return (
    <PictoTitleSubtitle.Container
      style={[
        {
          marginBottom: spacing.xl,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </PictoTitleSubtitle.Container>
  );
}

export const OnboardingPictoTitleSubtitle = {
  Subtitle: PictoTitleSubtitle.Subtitle,
  Title: PictoTitleSubtitle.Title,
  Container: OnboardingContainerComponent,
  Picto: PictoTitleSubtitle.Picto,
};
```

In this updated version:

1. We import the original `PictoTitleSubtitle` component.
2. We create a new `OnboardingContainerComponent` that wraps the original `PictoTitleSubtitle.Container`.
3. In `OnboardingContainerComponent`, we add the `marginBottom: spacing.xl` to the style.
4. We define `OnboardingPictoTitleSubtitle`, reusing most components from `PictoTitleSubtitle` but using our new `OnboardingContainerComponent` for the `Container`.

This approach allows you to reuse the original `PictoTitleSubtitle.Container` while adding the specific `marginBottom` for the onboarding version. The other components (Subtitle, Title, and Picto) are directly reused from the original `PictoTitleSubtitle`.

---



---

