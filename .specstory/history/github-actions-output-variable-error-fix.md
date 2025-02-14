## SpecStory

## GitHub Actions Output Variable Error Fix (1/30/2025, 8:14:22 PM)

_**User**_

Run echo "message=$(git log -1 --pretty=%B)" >> $GITHUB_OUTPUT
Error: Unable to process file command 'output' successfully.
Error: Invalid format 'In the midst of our cleanup, we didn't remove the usage of a temp directory to instantiate the xmtp client and so when we went to build the client, the db wasn't where we were expecting, hence the error. '

---

_**Assistant**_

I understand the issue. The error occurs because the commit message contains special characters that are causing problems when trying to set it as a GitHub Actions output variable. Let's modify the step to properly escape the commit message.

Here's the fix:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Get Commit Message
        id: commit_msg
        run: |
          # Escape the commit message and store it in a variable
          MSG=$(git log -1 --pretty=%B)
          # Properly escape the message for GitHub Actions output
          MSG="${MSG//'%'/'%25'}"
          MSG="${MSG//$'\n'/'%0A'}"
          MSG="${MSG//$'\r'/'%0D'}"
          echo "message=$MSG" >> $GITHUB_OUTPUT
// ... existing code ...
```

This change:
1. Gets the commit message and stores it in a variable
2. Properly escapes special characters that could cause issues:
   - `%` becomes `%25`
   - Newlines become `%0A`
   - Carriage returns become `%0D`
3. Outputs the escaped message to GitHub Actions output variable

This will handle commit messages containing special characters, spaces, and multiple lines without breaking the workflow.

---

_**User**_

For the code present, we get this error:
```
Type '{ paddingRight: 16; justifyContent: "flex-end"; marginBottom?: string | undefined; } | { paddingLeft: number; justifyContent: "flex-start"; marginBottom?: string | undefined; }' is not assignable to type 'StyleProp<ViewStyle>'.
  Type '{ paddingRight: 16; justifyContent: "flex-end"; marginBottom?: string | undefined; }' is not assignable to type 'StyleProp<ViewStyle>'.
    Type '{ paddingRight: 16; justifyContent: "flex-end"; marginBottom?: string | undefined; }' is not assignable to type 'undefined'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The issue is with the style spread syntax. Here's the fix:

```typescript:features/conversation/conversation-message/conversation-message-layout.tsx
// ... existing code ...
          <HStack
            style={{
              ...(fromMe
                ? {
                    paddingRight: messageContainerSidePadding,
                    justifyContent: "flex-end",
                  }
                : {
                    paddingLeft:
                      messageContainerSidePadding +
                      spaceBetweenSenderAvatarAndMessage +
                      senderAvatarSize,
                    justifyContent: "flex-start",
                  }),
              ...(hasNextMessageInSeries && {
                marginBottom: spaceBetweenSeriesWithReactions,
              }),
            }}
          >
// ... existing code ...
```

The fix moves the conditional marginBottom spread after the main style object spread to ensure proper type inference. This should resolve the TypeScript error while maintaining the same functionality.

---



---

