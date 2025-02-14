## SpecStory

## Adding Style Prop to HeaderAction Component (1/3/2025, 11:35:38 AM)

_**User**_

Add a prop "style" that will be applyed to the style of the container for each render

---

_**Assistant**_

I'll help you add a `style` prop that will be merged with the existing container styles. Here are the necessary changes:

```typescript:design-system/Header/HeaderAction.tsx
type HeaderActionProps = {
  // ... existing props ...
  style?: ViewStyle;
};

export function HeaderAction(props: HeaderActionProps) {
  const {
    backgroundColor,
    icon,
    text,
    tx,
    txOptions,
    onPress,
    ActionComponent,
    iconColor,
    style, // Add style to destructuring
  } = props;
  
  // ... existing code ...

  if (content) {
    return (
      <TouchableOpacity
        style={[themed([$actionTextContainer, { backgroundColor }]), style]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.8}
      >
        <Text preset="body" text={content} style={themed($actionText)} />
      </TouchableOpacity>
    );
  }

  if (icon) {
    return (
      <Pressable
        onPress={onPress}
        style={[themed([$actionIconContainer, { backgroundColor }]), style]}
      >
        <Icon size={theme.iconSize.md} icon={icon} color={iconColor} />
      </Pressable>
    );
  }

  return <View style={[themed($actionFillerContainer), { backgroundColor }, style]} />;
}
```

Changes made:
1. Added `style?: ViewStyle` to the `HeaderActionProps` type
2. Added `style` to the props destructuring
3. Modified each container's style prop to merge the new `style` prop using array syntax
4. The style prop will be applied last in the array to allow overriding of default styles

---



---

