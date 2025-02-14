## SpecStory

## Using Button Component in ShareProfileContent (10/16/2024, 10:18:38 AM)

_**User**_

Button

---

_**Assistant**_

Thank you for providing the current file content. I see that you've highlighted the import statement for the `Button` component from the design system. Based on your instructions and the context, I'll provide some suggestions on how to use this `Button` component in the `ShareProfileContent` component.

Here's how we can update the `ShareProfileContent` component to use the new `Button`:

```typescript:screens/ShareProfile.tsx
// ... existing imports ...

const ShareProfileContent = ({ /* ... existing props ... */ }) => {
  // ... existing code ...

  return (
    <View style={compact ? styles.shareProfileCompact : styles.shareProfile}>
      {/* ... existing content ... */}
      <View
        style={[
          styles.shareButtonContainer,
          compact && styles.shareButtonContainerCompact,
        ]}
      >
        {!compact ? (
          <Button
            variant="primary"
            title={shareButtonText}
            style={styles.shareButton}
            icon={
              Platform.OS === "web"
                ? copiedLink
                  ? "checkmark"
                  

---



---

