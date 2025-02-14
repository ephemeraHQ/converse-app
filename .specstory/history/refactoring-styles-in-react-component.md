## SpecStory

## Refactoring Styles in React Component (2/5/2025, 1:25:48 PM)

_**User**_

put all styles in the $ stuff. do like in @Header.tsx 

---

_**Assistant**_

I'll help you reorganize the styles in the `conversation-create-search.tsx` file following the pattern from `Header.tsx`. Here's how to update the styles:

```typescript:features/conversation/conversation-create/conversation-create-search.tsx
// ... existing code ...

return (
  <VStack style={themed($container)}>
    <HStack style={[themed($inputContainer)]}>
      <Center style={themed($toLabel)}>
        <Text color="secondary">To</Text>
      </Center>
      <HStack style={themed($chipContainer)}>
        {searchSelectedUserInboxIds.map((inboxId) => (
          <UserChip key={inboxId} inboxId={inboxId} />
        ))}
        <TextInput
          ref={inputRef}
          style={themed($input)}
          defaultValue={defaultSearchTextValue}
          onChangeText={handleChangeText}
          placeholder={
            searchSelectedUserInboxIds.length === 0
              ? "Name, address or onchain ID"
              : ""
          }
          placeholderTextColor={theme.colors.text.secondary}
          onKeyPress={handleKeyPress}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </HStack>
    </HStack>
  </VStack>
);

// ... existing code ...

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background.surfaceless,
  padding: spacing.sm,
});

const $inputContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  columnGap: spacing.xxs,
  alignItems: "center",
  minHeight: chipStyles.$content.height + chipStyles.$container.paddingVertical * 2,
});

const $toLabel: ThemedStyle<ViewStyle> = () => ({
  height: chipStyles.$content.height + chipStyles.$container.paddingVertical * 2,
});

const $chipContainer: ThemedStyle<ViewStyle> = ({ spacing, theme }) => ({
  flex: 1,
  gap: spacing.xxxs,
  alignItems: "center",
  flexWrap: "wrap",
});

const $input: ThemedStyle<ViewStyle> = ({ layout }) => ({
  flex: 1,
  minWidth: layout.screen.width / 4, // Ensures input doesn't get too narrow
});
```

The changes:
1. Moved all inline styles to themed style objects with the `$` prefix
2. Organized styles at the bottom of the file
3. Used consistent pattern for style definitions using `ThemedStyle<ViewStyle>`
4. Removed commented out debugBorder calls
5. Maintained the same functionality while making the code more maintainable

The styles are now more organized and follow the pattern used in `Header.tsx`. Each style object is named with a `$` prefix and uses the themed helper for consistent styling across the app.

---

_**User**_

create a const styles = ... like we do in @chip.tsx so that we can use "const chipStyles = useChipStyles();" inside and then in the code we'll do like styles.$container etc...

---

_**Assistant**_

I'll help you create a styles hook for the conversation-create-search component following the pattern from `chip.tsx`:

```typescript:features/conversation/conversation-create/conversation-create-search.tsx
// ... existing imports ...

function useConversationCreateSearchStyles() {
  const { theme } = useAppTheme();
  const chipStyles = useChipStyles();

  const $container = {
    backgroundColor: theme.colors.background.surfaceless,
    padding: theme.spacing.sm,
  } satisfies StyleProp<ViewStyle>;

  const $inputContainer = {
    columnGap: theme.spacing.xxs,
    alignItems: "center",
    minHeight: chipStyles.$content.height + chipStyles.$container.paddingVertical * 2,
  } satisfies StyleProp<ViewStyle>;

  const $toLabel = {
    height: chipStyles.$content.height + chipStyles.$container.paddingVertical * 2,
  } satisfies StyleProp<ViewStyle>;

  const $chipContainer = {
    flex: 1,
    gap: theme.spacing.xxxs,
    alignItems: "center",
    flexWrap: "wrap",
  } satisfies StyleProp<ViewStyle>;

  const $input = {
    flex: 1,
    minWidth: theme.layout.screen.width / 4,
  } satisfies StyleProp<ViewStyle>;

  return {
    $container,
    $inputContainer,
    $toLabel,
    $chipContainer,
    $input,
  } as const;
}

export function ConversationCreateSearch() {
  const { theme } = useAppTheme();
  const styles = useConversationCreateSearchStyles();
  const inputRef = useRef<RNTextInput | null>(null);
  // ... other existing code ...

  return (
    <VStack style={styles.$container}>
      <HStack style={styles.$inputContainer}>
        <Center style={styles.$toLabel}>
          <Text color="secondary">To</Text>
        </Center>
        <HStack style={styles.$chipContainer}>
          {searchSelectedUserInboxIds.map((inboxId) => (
            <UserChip key={inboxId} inboxId={inboxId} />
          ))}
          <TextInput
            ref={inputRef}
            style={styles.$input}
            defaultValue={defaultSearchTextValue}
            onChangeText={handleChangeText}
            placeholder={
              searchSelectedUserInboxIds.length === 0
                ? "Name, address or onchain ID"
                : ""
            }
            placeholderTextColor={theme.colors.text.secondary}
            onKeyPress={handleKeyPress}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </HStack>
      </HStack>
    </VStack>
  );
}

// ... rest of the file (UserChip component, store, etc.) ...
```

The changes:
1. Created a new `useConversationCreateSearchStyles` hook that returns all styles with `$` prefix
2. Removed the individual style constants from the bottom of the file
3. Updated the JSX to use `styles.$propertyName` instead of `themed($propertyName)`
4. Used `satisfies StyleProp<ViewStyle>` for better type inference
5. Removed the need for `themed` helper since styles are now created within the hook

This approach makes the styles more maintainable and consistent with the pattern used in `chip.tsx`.

---



---

