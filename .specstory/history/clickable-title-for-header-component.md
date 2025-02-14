## SpecStory

## Clickable Title for Header Component (1/27/2025, 10:20:27 AM)

_**User**_

can i do that if we press on the title, it also triggers the onBack. only fro the the titleContent, if we passed titlecompoennt you can igniroe

---

_**Assistant**_

I'll help you modify the Header component to make the title clickable and trigger the onBack function when pressed. Here's the change:

```typescript:design-system/Header/Header.tsx
// ... existing code ...

          {titleComponent ? (
            titleComponent
          ) : titleContent ? (
            <VStack
              style={[themed($titleContainer), $titleContainerStyleOverride]}
              // Remove pointerEvents="none" to make it clickable
            >
              <Text
                preset="body"
                text={titleContent}
                style={$titleStyleOverride}
                // Add onPress to trigger onBack when title is pressed
                onPress={onBack}
              />
            </VStack>
          ) : null}

// ... existing code ...
```

The changes made:
1. Removed the `pointerEvents="none"` from the VStack containing the title
2. Added `onPress={onBack}` to the Text component that displays the title

This way, when `titleContent` is used (not `titleComponent`), clicking on the title will trigger the same `onBack` function as the back button. The `titleComponent` behavior remains unchanged as requested.

---

_**User**_

For the code present, we get this error:
```
All mapping items must start at the same column at line 66, column 1:

          # TODO: This should be handled by schemes in the future?
          run: node scripts/build/ios/preview.js
^

```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error is due to incorrect YAML indentation. Here's the fix:

```yaml:.github/workflows/deploy-preview.yml
      - name: Update iOS Files
        # TODO: This should be handled by schemes in the future?
        run: node scripts/build/ios/preview.js

      # Version increment and build for preview with native changes
```

The fix aligns the comment and `run` statement with the same indentation level as the `name` field.

---



---

