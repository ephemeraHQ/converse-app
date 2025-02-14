## SpecStory

## Completing Props for React Native Context Menu (12/2/2024, 9:59:02 AM)

_**User**_

look at docs here @https://github.com/dominicstop/react-native-ios-context-menu?tab=readme-ov-file 

And complete the missing props

---

_**Assistant**_

Based on the documentation for `react-native-ios-context-menu`, you can configure the `menuConfig` and `auxiliaryPreviewConfig` properties to enhance the functionality of the `ContextMenuView`. Here's how you can complete the missing props:

```typescript:components/Chat/Message/message-content-types/message-simple-text.tsx
      <ContextMenuView
        menuConfig={{
          menuTitle: 'Message Options',
          menuItems: [
            {
              actionKey: 'copy',
              actionTitle: 'Copy',
              icon: {
                type: 'IMAGE_SYSTEM',
                imageValue: {
                  systemName: 'doc.on.doc',
                },
              },
            },
            {
              actionKey: 'delete',
              actionTitle: 'Delete',
              menuAttributes: ['destructive'],
              icon: {
                type: 'IMAGE_SYSTEM',
                imageValue: {
                  systemName: 'trash',
                },
              },
            },
          ],
        }}
        auxiliaryPreviewConfig={{
          transitionEntranceDelay: 'RECOMMENDED',
          alignmentHorizontal: 'previewCenter',
        }}
        isAuxiliaryPreviewEnabled={true}
        renderAuxiliaryPreview={() => (
          <HStack>
            <Text>Preview Content</Text>
          </HStack>
        )}
      >
```

### Explanation:
- **menuConfig**: 
  - `menuTitle`: Sets the title of the context menu.
  - `menuItems`: Defines the actions available in the context menu. Each item has an `actionKey`, `actionTitle`, and an optional `icon`.
  - `icon`: Uses system icons for visual representation.

- **auxiliaryPreviewConfig**:
  - `transitionEntranceDelay`: Controls the delay before the auxiliary preview appears.
  - `alignmentHorizontal`: Aligns the auxiliary preview horizontally.

These configurations provide a basic setup for a context menu with "Copy" and "Delete" actions, using system icons for visual cues. Adjust the `menuItems` and `auxiliaryPreviewConfig` as needed to fit your application's requirements.

---



---

