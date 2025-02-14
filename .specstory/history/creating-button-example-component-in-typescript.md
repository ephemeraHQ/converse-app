## SpecStory

## Creating Button Example Component in TypeScript (11/8/2024, 11:16:13 AM)

_**User**_

do something like @Icon.example.tsx but do it for Button so check @Button.props.ts  and @Button.tsx 

---

_**Assistant**_

I'll help you create a Button.example.tsx file that demonstrates various use cases of the Button component based on the props defined in Button.props.ts.

```typescript:design-system/Button/Button.example.tsx
import { View } from "react-native";
import { Button } from "./Button";
import { Icon } from "../Icon/Icon";

type IExampleProps = {
  onPress?: () => void;
};

export function ButtonExample(args: IExampleProps) {
  const { onPress } = args;
  
  return (
    <View style={{ gap: 16, padding: 16 }}>
      {/* Basic Variants */}
      <Button
        text="Fill Button"
        variant="fill"
        onPress={onPress}
      />
      
      <Button
        text="Outline Button"
        variant="outline"
        onPress={onPress}
      />
      
      <Button
        text="Link Button"
        variant="link"
        onPress={onPress}
      />

      {/* Sizes */}
      <Button
        text="Small Button"
        size="sm"
        onPress={onPress}
      />
      
      <Button
        text="Large Button"
        size="lg"
        onPress={onPress}
      />

      {/* States */}
      <Button
        text="Loading Button"
        loading={true}
        onPress={onPress}
      />
      
      <Button
        text="Disabled Button"
        disabled={true}
        onPress={onPress}
      />

      {/* Actions */}
      <Button
        text="Danger Button"
        action="danger"
        onPress={onPress}
      />

      {/* With Icons */}
      <Button
        text="Button with Icon"
        icon="arrow-right"
        onPress={onPress}
      />

      {/* Custom Accessories */}
      <Button
        text="Custom Left Accessory"
        LeftAccessory={({ style }) => (
          <Icon name="arrow-left" style={style} />
        )}
        onPress={onPress}
      />

      {/* i18n Example */}
      <Button
        tx="common.submit"
        txOptions={{ name: "John" }}
        onPress={onPress}
      />

      {/* With Haptic Feedback */}
      <Button
        text="Haptic Button"
        withHapticFeedback
        onPress={onPress}
      />
    </View>
  );
}
```

This example file showcases:
1. Different button variants (fill, outline, link)
2. Size variations (sm, md, lg)
3. States (loading, disabled)
4. Actions (primary, danger)
5. Icon usage
6. Custom accessories
7. Internationalization (i18n) support
8. Haptic feedback

Each button is wrapped in a View with proper spacing to make it easy to see all variations. You can use this example file to:
1. Test different button configurations
2. Demonstrate available button options to other developers
3. Verify button behavior in different states
4. Use as documentation for the Button component

The examples follow your preferred code style with:
- Functional components
- TypeScript types (starting with 'I')
- Destructured props
- Clean, readable code structure
- Inline styles
- Early returns and clear prop passing

---

_**User**_

Use our theme! Const {theme} = useAppTheme

---

_**Assistant**_

I'll update the example using our theme system:

```typescript:design-system/Button/Button.example.tsx
import { View } from "react-native";
import { Button } from "./Button";
import { Icon } from "../Icon/Icon";
import { useAppTheme } from "../../hooks/useAppTheme";

type IExampleProps = {
  onPress?: () => void;
};

export function ButtonExample(args: IExampleProps) {
  const { onPress } = args;
  const { theme } = useAppTheme();
  
  return (
    <View style={{ 
      gap: theme.spacing.md, 
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background 
    }}>
      {/* Basic Variants */}
      <Button
        text="Fill Button"
        variant="fill"
        onPress={onPress}
      />
      
      <Button
        text="Outline Button"
        variant="outline"
        onPress={onPress}
      />
      
      <Button
        text="Link Button"
        variant="link"
        onPress={onPress}
      />

      {/* Sizes */}
      <Button
        text="Small Button"
        size="sm"
        onPress={onPress}
      />
      
      <Button
        text="Large Button"
        size="lg"
        onPress={onPress}
      />

      {/* States */}
      <Button
        text="Loading Button"
        loading={true}
        onPress={onPress}
      />
      
      <Button
        text="Disabled Button"
        disabled={true}
        onPress={onPress}
      />

      {/* Actions */}
      <Button
        text="Danger Button"
        action="danger"
        onPress={onPress}
      />

      {/* With Icons */}
      <Button
        text="Button with Icon"
        icon="arrow-right"
        onPress={onPress}
      />

      {/* Custom Accessories */}
      <Button
        text="Custom Left Accessory"
        LeftAccessory={({ style }) => (
          <Icon name="arrow-left" style={style} />
        )}
        onPress={onPress}
      />

      {/* i18n Example */}
      <Button
        tx="common.submit"
        txOptions={{ name: "John" }}
        onPress={onPress}
      />

      {/* With Haptic Feedback */}
      <Button
        text="Haptic Button"
        withHapticFeedback
        onPress={onPress}
      />

      {/* Section with dark background to test contrast */}
      <View style={{
        backgroundColor: theme.colors.backgroundDark,
        padding: theme.spacing.md,
        gap: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
      }}>
        <Button
          text="Button on Dark Background"
          variant="fill"
          onPress={onPress}
        />
        
        <Button
          text="Outline on Dark Background"
          variant="outline"
          onPress={onPress}
        />
      </View>
    </View>
  );
}
```

I've made these theme-related improvements:
1. Added `useAppTheme` hook to access our theme
2. Used theme spacing for gaps and padding
3. Used theme colors for backgrounds
4. Added a dark background section to test button contrast
5. Used theme border radius for the dark section

The example now better reflects how the buttons would look in our actual themed application, showing how they adapt to both light and dark backgrounds.

---



---

