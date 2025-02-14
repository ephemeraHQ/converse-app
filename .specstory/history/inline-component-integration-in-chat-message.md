## SpecStory

## Inline Component Integration in Chat Message (11/14/2024, 10:13:25 AM)

_**User**_

add this component inline I dont want a reuable componet 



---

_**Assistant**_

I'll help you inline the `PressableProfileWithText` component directly into the `ChatGroupUpdatedMessage`. Here's how to modify the code:

```typescript:components/Chat/ChatGroupUpdatedMessage.tsx
// ... existing imports ...
import { ParsedText } from "@components/ParsedText/ParsedText";
import { textFontWeightStyles } from "@design-system/Text/Text.styles";
import { getTextStyle } from "@design-system/Text/Text.utils";

// ... existing code until return statement ...

  return (
    <VStack style={themed($container)}>
      {membersActions.map((action) => {
        const pattern = new RegExp(action.readableName, "g");
        const handlePressInner = () => handlePress(action.address);
        const parseOptions = [{
          onPress: handlePressInner,
          pattern,
        }];

        const $textStyle = getTextStyle(themed, {
          preset: "smaller",
          size: "xxs",
          style: themed($textSecondaryStyle),
        });

        return (
          <ParsedText
            key={action.address}
            parse={parseOptions}
            pressableStyle={$pressableStyle}
            style={$textStyle}
          >
            {action.content}
          </ParsedText>
        );
      })}
    </VStack>
  );
}

const $pressableStyle = {
  ...textFontWeightStyles.bold,
};

const $textSecondaryStyle: ThemedStyle<TextStyle> = (theme) => ({
  color: theme.colors.fill.secondary,
});

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
});
```

Key changes made:
1. Removed the `PressableProfileWithText` component import
2. Added imports for `ParsedText` and related styling utilities
3. Inlined the parsing logic directly in the map function
4. Added the necessary styles at the bottom of the file
5. Simplified the component by removing the extra abstraction layer

You can now delete the `PressableProfileWithText.tsx` file since its functionality is now inlined in the `ChatGroupUpdatedMessage` component.

---



---

