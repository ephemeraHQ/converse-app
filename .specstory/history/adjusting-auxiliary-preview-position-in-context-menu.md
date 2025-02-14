## SpecStory

## Adjusting Auxiliary Preview Position in Context Menu (12/2/2024, 10:46:00 AM)

_**User**_

look @https://github.com/dominicstop/react-native-ios-context-menu I want the auxiliary to be on top of 

---

_**Assistant**_

To position the auxiliary preview on top of the context menu, you can adjust the `anchorPosition` in the `auxiliaryPreviewConfig` of the `ContextMenuView`. Here's how you can modify your code:

```typescript:components/Chat/Message/message-content-types/message-simple-text.tsx
      <BubbleContainer fromMe={fromMe}>
        <ContextMenuView
          menuConfig={{
            menuTitle: "Message Options",
            menuItems: [
              {
                actionKey: "copy",
                actionTitle: "Copy",
                icon: {
                  type: "IMAGE_SYSTEM",
                  imageValue: {
                    systemName: "doc.on.doc",
                  },
                },
              },
              {
                actionKey: "delete",
                actionTitle: "Delete",
                menuAttributes: ["destructive"],
                icon: {
                  type: "IMAGE_SYSTEM",
                  imageValue: {
                    systemName: "trash",
                  },
                },
              },
            ],
          }}
          auxiliaryPreviewConfig={{
            transitionEntranceDelay: "RECOMMENDED",
            alignmentHorizontal: "previewCenter",
            anchorPosition: "top", // Position the auxiliary preview on top
          }}
          isAuxiliaryPreviewEnabled={true}
          renderAuxiliaryPreview={() => (
            <HStack>
              <Text>Preview Content</Text>
            </HStack>
          )}
        >
          <BubbleContentContainer
            fromMe={fromMe}
            hasNextMessageInSeries={hasNextMessageInSeries}
          >
            <MessageText inverted={fromMe}>{textContent}</MessageText>
          </BubbleContentContainer>
        </ContextMenuView>
      </BubbleContainer>
```

### Explanation:
- **`anchorPosition: "top"`**: This line sets the auxiliary preview to appear on top of the context menu. This configuration is part of the `auxiliaryPreviewConfig` object in the `ContextMenuView` component. 

This change should position your auxiliary preview as desired. For more details, you can refer to the [react-native-ios-context-menu documentation](https://github.com/dominicstop/react-native-ios-context-menu).

---

_**User**_

how can i have the menu items to be on the bottom?

---

_**Assistant**_

To position the menu items at the bottom of the context menu, you can adjust the `anchorPosition` in the `menuConfig` of the `ContextMenuView`. Here's how you can modify your code:

```typescript:components/Chat/Message/message-content-types/message-simple-text.tsx
      <BubbleContainer fromMe={fromMe}>
        <ContextMenuView
          menuConfig={{
            menuTitle: "Message Options",
            menuItems: [
              {
                actionKey: "copy",
                actionTitle: "Copy",
                icon: {
                  type: "IMAGE_SYSTEM",
                  imageValue: {
                    systemName: "doc.on.doc",
                  },
                },
              },
              {
                actionKey: "delete",
                actionTitle: "Delete",
                menuAttributes: ["destructive"],
                icon: {
                  type: "IMAGE_SYSTEM",
                  imageValue: {
                    systemName: "trash",
                  },
                },
              },
            ],
            anchorPosition: "bottom", // Position the menu items at the bottom
          }}
          auxiliaryPreviewConfig={{
            transitionEntranceDelay: "RECOMMENDED",
            alignmentHorizontal: "previewCenter",
            anchorPosition: "top", // Keep auxiliary preview on top
          }}
          isAuxiliaryPreviewEnabled={true}
          renderAuxiliaryPreview={() => (
            <HStack>
              <Text>Preview Content</Text>
            </HStack>
          )}
        >
          <BubbleContentContainer
            fromMe={fromMe}
            hasNextMessageInSeries={hasNextMessageInSeries}
          >
            <MessageText inverted={fromMe}>{textContent}</MessageText>
          </BubbleContentContainer>
        </ContextMenuView>
      </BubbleContainer>
```

### Explanation:
- **`anchorPosition: "bottom"`**: This line in the `menuConfig` object positions the menu items at the bottom of the context menu. 

This configuration should help you achieve the desired layout for your context menu. If you need further customization, you might want to check the [react-native-ios-context-menu documentation](https://github.com/dominicstop/react-native-ios-context-menu) for additional options.

---

_**User**_

no there's no "anchorPosition" property for menuConfig

---

_**Assistant**_

You're right, the `menuConfig` in `react-native-ios-context-menu` does not have an `anchorPosition` property. To position the menu items at the bottom, you typically rely on the default behavior of the context menu, which is influenced by the position of the `ContextMenuView` in your layout.

If you want to ensure that the menu items appear at the bottom of the screen or a specific area, you might need to adjust the layout of your component or the position of the `ContextMenuView` itself. Here's a general approach:

1. **Ensure the `ContextMenuView` is positioned at the bottom of its parent container**: This can be done by adjusting the layout styles of the parent container or the `ContextMenuView`.

2. **Use Flexbox for layout**: If your component is part of a flex container, you can use properties like `justifyContent: 'flex-end'` to push the `ContextMenuView` to the bottom.

Here's an example of how you might adjust the layout:

```typescript:components/Chat/Message/message-content-types/message-simple-text.tsx
import { StyleSheet } from 'react-native';

export const MessageSimpleText = memo(function MessageSimpleText(props: {
  message: DecodedMessage<[TextCodec]>;
}) {
  const { message } = props;

  const textContent = message.content();

  const { hasNextMessageInSeries, fromMe } = useMessageContextStoreContext(
    useSelect(["hasNextMessageInSeries", "fromMe"])
  );

  return (
    <MessageLayout style={styles.container}>
      <BubbleContainer fromMe={fromMe}>
        <ContextMenuView
          menuConfig={{
            menuTitle: "Message Options",
            menuItems: [
              {
                actionKey: "copy",
                actionTitle: "Copy",
                icon: {
                  type: "IMAGE_SYSTEM",
                  imageValue: {
                    systemName: "doc.on.doc",
                  },
                },
              },
              {
                actionKey: "delete",
                actionTitle: "Delete",
                menuAttributes: ["destructive"],
                icon: {
                  type: "IMAGE_SYSTEM",
                  imageValue: {
                    systemName: "trash",
                  },
                },
              },
            ],
          }}
          auxiliaryPreviewConfig={{
            transitionEntranceDelay: "RECOMMENDED",
            alignmentHorizontal: "previewCenter",
            anchorPosition: "top",
          }}
          isAuxiliaryPreviewEnabled={true}
          renderAuxiliaryPreview={() => (
            <HStack>
              <Text>Preview Content</Text>
            </HStack>
          )}
        >
          <BubbleContentContainer
            fromMe={fromMe}
            hasNextMessageInSeries={hasNextMessageInSeries}
          >
            <MessageText inverted={fromMe}>{textContent}</MessageText>
          </BubbleContentContainer>
        </ContextMenuView>
      </BubbleContainer>
    </MessageLayout>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end', // Pushes content to the bottom
  },
});
```

### Explanation:
- **`justifyContent: 'flex-end'`**: This style property in the `MessageLayout` component's container pushes its children to the bottom, which can help position the `ContextMenuView` at the bottom of the screen or its parent container.

If this doesn't achieve the desired effect, you may need to further adjust the layout of your component or consider using absolute positioning for more control over the placement of the `ContextMenuView`.

---



---

