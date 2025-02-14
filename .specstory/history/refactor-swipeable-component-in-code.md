## SpecStory

## Refactor Swipeable Component in Code (1/9/2025, 9:46:24 AM)

_**User**_

seaprate teh swipeable component and all its props into a new component. So move the props from ConversationListItemDumbProps to create new props for this new component. and remove it's usage inthe compoonent.

---

_**Assistant**_

I'll help you extract the Swipeable-related functionality into a new component. Here are the changes needed:

```typescript:features/conversation-list/components/conversation-list-item.tsx
// ... existing imports ...

type ISwipeableWrapperProps = {
  leftActionIcon: IIconName;
  onLeftSwipe?: () => void;
  onRightSwipe?: () => void;
  onLeftActionPress?: () => void;
  onWillLeftSwipe?: () => void;
  onRightActionPress?: () => void;
  onWillRightSwipe?: () => void;
  rightIsDestructive?: boolean;
  children: React.ReactNode;
};

function SwipeableWrapper({
  leftActionIcon,
  onLeftSwipe,
  onRightSwipe,
  onLeftActionPress,
  onWillLeftSwipe,
  onRightActionPress,
  onWillRightSwipe,
  rightIsDestructive,
  children,
}: ISwipeableWrapperProps) {
  const { themed, theme } = useAppTheme();
  const { iconSize } = theme;
  const themedInversePrimaryColor = theme.colors.fill.inverted.primary;

  const renderLeftActions = useCallback(() => {
    return (
      <RectButton style={themed($leftAction)}>
        <Icon
          icon={leftActionIcon}
          color={themedInversePrimaryColor}
          size={iconSize.lg}
        />
      </RectButton>
    );
  }, [leftActionIcon, themed, themedInversePrimaryColor, iconSize.lg]);

  const renderRightActions = useCallback(() => {
    if (rightIsDestructive) {
      return (
        <RectButton style={themed($rightAction)} onPress={onRightActionPress}>
          <Icon
            icon="checkmark"
            color={themedInversePrimaryColor}
            size={iconSize.lg}
          />
        </RectButton>
      );
    }

    return (
      <RectButton style={themed($rightActionRed)} onPress={onRightActionPress}>
        <Icon icon="trash" color="white" size={iconSize.lg} />
      </RectButton>
    );
  }, [
    rightIsDestructive,
    themed,
    onRightActionPress,
    themedInversePrimaryColor,
    iconSize.lg,
  ]);

  const onSwipeableWillClose = useCallback(
    (direction: "left" | "right") => {
      if (direction === "left") {
        onWillLeftSwipe?.();
      } else {
        onWillRightSwipe?.();
      }
    },
    [onWillLeftSwipe, onWillRightSwipe]
  );

  const onSwipeableClose = useCallback(
    (direction: "left" | "right") => {
      if (direction === "left") {
        onLeftSwipe?.();
      } else {
        onRightSwipe?.();
      }
    },
    [onLeftSwipe, onRightSwipe]
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      leftThreshold={10000}
      overshootFriction={4}
      onSwipeableWillClose={onSwipeableWillClose}
      onSwipeableClose={onSwipeableClose}
      hitSlop={{ left: -6 }}
    >
      {children}
    </Swipeable>
  );
}

export type ConversationListItemDumbProps = {
  title?: string;
  subtitle?: string;
  avatarComponent?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  isUnread: boolean;
  showError: boolean;
  showImagePreview: boolean;
  imagePreviewUrl: string | undefined;
} & ISwipeableWrapperProps;

export const ConversationListItemDumb = memo(
  function ConversationListItemDumb({
    onPress,
    onLongPress,
    isUnread,
    title,
    subtitle,
    avatarComponent,
    showError,
    ...swipeableProps
  }: ConversationListItemDumbProps) {
    const { themed } = useAppTheme();

    return (
      <SwipeableWrapper {...swipeableProps}>
        <TouchableHighlight onPress={onPress} style={themed($touchable)}>
          <HStack style={themed($conversationListItem)}>
            <Center style={$avatarWrapper}>{avatarComponent}</Center>
            <VStack style={themed($messagePreviewContainer)}>
              <Text preset="bodyBold" weight="medium" numberOfLines={1}>
                {title}
              </Text>
              <Text preset="small" numberOfLines={2} color="secondary">
                {subtitle}
              </Text>
            </VStack>
            {(isUnread || showError) && (
              <Center style={$unreadContainer}>
                <Center
                  style={[
                    themed($unread),
                    (!isUnread || showError) && themed($placeholder),
                  ]}
                />
              </Center>
            )}
          </HStack>
        </TouchableHighlight>
      </SwipeableWrapper>
    );
  }
);

// ... existing styles ...
```

Key changes made:
1. Created a new `SwipeableWrapper` component with its own props type `ISwipeableWrapperProps`
2. Moved all swipeable-related props and logic to the new component
3. Simplified the `ConversationListItemDumb` component by removing swipeable-specific code
4. Updated `ConversationListItemDumbProps` to extend `ISwipeableWrapperProps`
5. Removed the `forwardRef` since it's no longer needed for the main component
6. Used prop spreading to pass swipeable props to the wrapper component

The component is now more modular and the swipeable functionality is properly encapsulated in its own component.

---



---

