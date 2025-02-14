## SpecStory

## Code Improvements for Group Metadata Handling (2/10/2025, 3:46:50 PM)

_**User**_

clean

---

_**Assistant**_

Looking at the code, I notice a few potential improvements we could make to enhance readability and maintainability:

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
// ... existing code ...

const handleGroupMetadataChange = ({
  initiatorName,
  content,
}: {
  initiatorName: string;
  content: ReturnType<GroupUpdatedCodec["decode"]>;
}) => {
  const translations = {
    group_name: translate("conversation_list.name_changed", {
      userName: initiatorName,
      newValue: content.metadataFieldsChanged[0]?.newValue,
    }),
    description: translate("conversation_list.description_changed", {
      userName: initiatorName,
      newValue: content.metadataFieldsChanged[0]?.newValue,
    }),
    group_image_url_square: translate("conversation_list.image_changed", {
      userName: initiatorName,
    }),
  };

  if (content.metadataFieldsChanged.length !== 1) {
    return translate("conversation_list.updated_the_group", { userName: initiatorName });
  }

  const change = content.metadataFieldsChanged[0];
  return translations[change.fieldName] ?? 
    translate("conversation_list.updated_the_group", { userName: initiatorName });
};

// ... existing code ...

export const useMessagePlainText = (

---



---

