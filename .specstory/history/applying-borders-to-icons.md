## SpecStory

## Applying Borders to Icons (1/3/2025, 2:17:09 PM)

_**User**_

possible to apply border to the icon? The way i tried now dones't work because i want the border to follow the path of the icon

---

_**Assistant**_

Ah, I understand you want to create a border/stroke that follows the actual shape of the icon rather than putting a rectangular border around it. Unfortunately, directly applying a border to an icon won't follow its path.

Here are a couple of alternatives:

1. If you're using an SVG icon, the best approach would be to modify the SVG itself to include a stroke in its path. This would give you the exact outline you want.

2. For system icons, you could create the stroke effect by stacking two icons - one slightly larger in the border color behind the main icon:

```typescript:screens/ConversationList.tsx
// ... existing code ...
<Center>
  <Icon
    icon="shield.fill"
    color="red"  // border color
    size={theme.iconSize.sm + 2}  // slightly larger
    style={{
      position: 'absolute',
    }}
  />
  <Icon
    icon="shield.fill"
    color={theme.colors.global.green}
    size={theme.iconSize.sm}
  />
</Center>
// ... existing code ...
```

If you're specifically using an SVG icon through a custom Icon component, you might want to modify the SVG to include a stroke attribute directly in its path, like:

```svg
<path stroke="red" stroke-width="1" d="...path data..." />
```

Which approach would work best for your specific icon implementation?

---



---

