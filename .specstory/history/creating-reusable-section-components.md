## SpecStory

## Creating Reusable Section Components (1/27/2025, 10:07:58 AM)

_**User**_

I want different secitons. Like create a reusable component for section header and then put env in first section and then expo update should be another section

---

_**Assistant**_

I'll help you create a section component and reorganize the content. Here's how we can modify the code:

```typescript:features/app-settings/app-settings.screen.tsx
// ... existing code ...

export const AppSettingsScreen = memo(function AppSettingsScreen() {
  return (
    <Screen>
      <VStack space="lg">
        <Section title="Environment">
          <DebugText>Env: {getEnv()}</DebugText>
        </Section>

        <Section title="Expo Updates">
          <ExpoUpdates />
        </Section>
      </VStack>
    </Screen>
  );
});

const Section = memo(function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <VStack space="md">
      <Text variant="heading3">{title}</Text>
      {children}
    </VStack>
  );
});

// ... existing code ...
```

I've made the following changes:
1. Created a new `Section` component that takes a title and children
2. Added spacing between sections using `space="lg"` on the parent VStack
3. Wrapped the environment info and ExpoUpdates in separate sections with appropriate titles
4. Used `variant="heading3"` for section titles (adjust the variant based on your design system)

The rest of the code remains unchanged. This creates a clearer visual hierarchy and makes the settings screen more organized.

---



---

