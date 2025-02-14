## SpecStory

## Improving File Naming Conventions (2/17/2025, 10:22:37 AM)

_**User**_

make better "If we have a folder called conversation and inside we have a file that render a list of messages. This file should be called conversation-messages.tsx"

---

_**Assistant**_

Let me improve that section of the file naming convention guidelines:

```markdown:file-structure.mdc
### Use folder name in file name

When creating files within a feature folder, prefix the file name with the feature name for better organization and clarity:

// ❌ Bad: Generic names without feature context
messages.tsx
list.tsx
details.tsx

// ✅ Good: Feature name prefixed
conversation-messages.tsx
conversation-list.tsx
conversation-details.tsx

This naming convention:
- Makes it easier to locate files
- Provides clear context about the file's purpose
- Maintains consistency across the codebase
- Prevents naming conflicts with similar components in other features

Example folder structure:
```
features/
  conversation/
    conversation-messages.tsx      // List of messages in a conversation
    conversation-details.tsx       // Conversation details view
    conversation-participants.tsx  // Participants list component
  profile/
    profile-details.tsx           // Profile details view
    profile-settings.tsx          // Profile settings component
```
```

---



---

