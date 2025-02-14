## SpecStory

## Error Handling for Metadata Fields (1/16/2025, 2:06:25 PM)

_**User**_

possible to add that if we have an updated meta field name that isn't part of the map we have than capture error

---

_**Assistant**_

I'll help you modify the code to capture errors for unsupported metadata field names. Here's the updated version:

```typescript:utils/xmtpRN/messages.ts
// ... existing code ...

function handleNewGroupUpdatedMessage(args: {
  account: string;
  topic: ConversationTopic;
  message: DecodedMessageWithCodecsType;
}) {
  const { account, topic, message } = args;

  if (!message.contentTypeId.includes("group_updated")) return;
  const content = message.content() as GroupUpdatedContent;

  // Handle member changes
  if (content.membersAdded.length > 0 || content.membersRemoved.length > 0) {
    invalidateGroupMembersQuery(account, topic);
    return;
  }

  // Handle metadata changes
  if (content.metadataFieldsChanged.length > 0) {
    content.metadataFieldsChanged.forEach((field) => {
      const fieldName = field.fieldName as MetadataField;
      
      // Capture error if field name is not supported
      if (!(fieldName in METADATA_FIELD_MAP)) {
        captureError(new Error(`Unsupported metadata field name: ${fieldName}`));
        return;
      }

      const updateKey = METADATA_FIELD_MAP[fieldName];
      if (updateKey && field.newValue) {
        const update = { [updateKey]: field.newValue };

        updateConversationQueryData({
          account,
          topic,
          conversationUpdate: update,
        });

        updateConversationInConversationsQueryData({
          account,
          topic,
          conversationUpdate: update,
        });
      }
    });
    return;
  }

  // Handle admin updates (when no other changes detected)
  invalidateGroupMembersQuery(account, topic);
}
```

I've added a check to capture errors when we encounter a metadata field name that isn't defined in our `METADATA_FIELD_MAP`. This will help us track any unexpected field names that might be introduced in the future.

---



---

