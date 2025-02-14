## SpecStory

## Conditional Margin Based on Component Presence (9/26/2024, 4:02:30 PM)

_**User**_

what would you suggest if i want to apply some margin bottom on some stuff but the margin bottom will depends on whatother comp we render... like if we have no subtitle, title wont need margin bottom for example

---

_**Assistant**_

To address your requirement of applying conditional margin bottom based on the presence of other components, we can modify the `PictoTitleSubtitle` component to use a compound component pattern with a context. This approach will allow us to dynamically adjust margins based on which components are rendered.

Here's how we can update the file:

```typescript:components/PictoTitleSubtitle.tsx
import React, { createContext, useContext, ReactNode } from "react";
import Picto from "@components/Picto";
import { ITextProps, Text } from "@design-system/Text";
import { ITitleProps, Title } from "@design-system/Title";
import VStack, { IVStackProps } from "@design-system/VStack";
import { IPictoProps } from "./Picto/Picto";

// ... existing code ...

// Add this new context
const PictoTitleSubtitleContext = createContext({
  hasSubtitle: false,
  setHasSubtitle: (value: boolean) => {},
});

export function ContainerComponent({ children, ...props }: IVStackProps) {
  const [hasSubtitle, setHasSubtitle] = React.useState(false);

  return (
    <PictoTitleSubtitleContext.Provider value={{ hasSubtitle, setHasSubtitle }}>
      <VStack
        style={{ alignItems: "center", justifyContent: "center" }}
        {...props}
      >
        {children}
      </VStack>
    </PictoTitleSubtitleContext.Provider>
  );
}

export function TitleComponent({ style, ...rest }: ITitleProps) {
  const { hasSubtitle } = useContext(PictoTitleSubtitleContext);
  return (
    <Title
      style={[
        { textAlign: "center" },
        hasSubtitle ? { marginBottom: 8 } : null,
        style,
      ]}
      {...rest}
    />
  );
}

export function SubtitleComponent({ style, ...rest }: ITextProps) {
  const { setHasSubtitle } = useContext(PictoTitleSubtitleContext);
  React.useEffect(() => {
    setHasSubtitle(true);
    return () => setHasSubtitle(false);
  }, [setHasSubtitle]);

  return <Text style={[{ textAlign: "center" }, style]} {...rest} />;
}

// ... rest of the existing code ...
```

This update introduces the following changes:

1. We create a `PictoTitleSubtitleContext` to manage the state of whether a subtitle is present.
2. The `ContainerComponent` now provides this context to its children.
3. The `TitleComponent` uses the context to conditionally apply a bottom margin when a subtitle is present.
4. The `SubtitleComponent` uses an effect to update the context when it's mounted or unmounted.

With these changes, the `Title` component will automatically have a bottom margin when a `Subtitle` is present, and no margin when it's not. You can adjust the margin value (currently set to 8) as needed.

This approach is flexible and can be extended to handle other conditional styling based on the presence of different components within the `PictoTitleSubtitle` structure.

---

_**User**_

i dont like that. look online for better pattern

---

_**Assistant**_

I apologize for the previous suggestion. You're right to look for a better pattern. After researching more elegant solutions, I've found a popular and more flexible approach using a compound component pattern with implicit state sharing. This pattern is used by libraries like Radix UI and is more maintainable and easier to use.

Here's an improved version of the `PictoTitleSubtitle` component:

```typescript:components/PictoTitleSubtitle.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";
import Picto from "@components/Picto";
import { ITextProps, Text } from "@design-system/Text";
import { ITitleProps, Title } from "@design-system/Title";
import VStack, { IVStackProps } from "@design-system/VStack";
import { IPictoProps } from "./Picto/Picto";

// Context to share state between components
const PictoTitleSubtitleContext = createContext<{
  hasSubtitle: boolean;
  registerSubtitle: () => void;
}>({
  hasSubtitle: false,
  registerSubtitle: () => {},
});

// Root component
function Root({ children, ...props }: IVStackProps) {
  const [hasSubtitle, setHasSubtitle] = useState(false);

  const registerSubtitle = () => setHasSubtitle(true);

  return (
    <PictoTitleSubtitleContext.Provider value={{ hasSubtitle, registerSubtitle }}>
      <VStack
        style={{ alignItems: "center", justifyContent: "center" }}
        {...props}
      >
        {children}
      </VStack>
    </PictoTitleSubtitleContext.Provider>
  );
}

// Subcomponents
function Subtitle({ style, ...rest }: ITextProps) {
  const { registerSubtitle } = useContext(PictoTitleSubtitleContext);
  React.useEffect(registerSubtitle, []);
  return <Text style={[{ textAlign: "center" }, style]} {...rest} />;
}

function Title({ style, ...rest }: ITitleProps) {
  const { hasSubtitle } = useContext(PictoTitleSubtitleContext);
  return (
    <Title
      style={[
        { textAlign: "center" },
        hasSubtitle ? { marginBottom: 8 } : null,
        style,
      ]}
      {...rest}
    />
  );
}

function PictoComponent(props: IPictoProps) {
  return <Picto style={{ height: props.size }} {...props} />;
}

// Compound component
export const PictoTitleSubtitle = {
  Root,
  Subtitle,
  Title,
  Picto: PictoComponent,
};
```

This new implementation offers several advantages:

1. It uses a compound component pattern, which is more flexible and intuitive to use.
2. The state management is implicit, handled by the `Root` component.
3. The `Subtitle` component registers itself automatically when rendered.
4. The `Title` component adjusts its margin based on the presence of a `Subtitle`.

To use this component, you would structure it like this:

```jsx
<PictoTitleSubtitle.Root>
  <PictoTitleSubtitle.Picto name="some-icon" size={24} />
  <PictoTitleSubtitle.Title>Main Title</PictoTitleSubtitle.Title>
  <PictoTitleSubtitle.Subtitle>Optional Subtitle</PictoTitleSubtitle.Subtitle>
</PictoTitleSubtitle.Root>
```

This pattern allows for more flexibility in component composition while still maintaining the desired conditional styling. The margin bottom on the `Title` will only be applied when a `Subtitle` is present, and you can easily extend this pattern to handle other conditional styling or behavior as needed.

---



---

