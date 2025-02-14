## SpecStory

## Update Error Logging with JSON.stringify() (1/21/2025, 2:34:03 PM)

_**User**_

replace all the parseResult.error with JSON.stringiffy

---

_**Assistant**_

I'll help you update all instances where `parseResult.error` is logged to use `JSON.stringify()`. Here are the necessary edits:

```typescript:utils/api/topics.ts
// ... existing code ...

  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] getTopics parse error:",
      JSON.stringify(parseResult.error)
    );
  }

// ... existing code ...

  if (!parseResult.success) {
    logger.error("[API TOPICS] getAllTopics parse error:", JSON.stringify(parseResult.error));
  }

// ... existing code ...

  if (!parseResult.success) {
    logger.error("[API TOPICS] getTopic parse error:", JSON.stringify(parseResult.error));
  }

// ... existing code ...

  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] markTopicAsRead parse error:",
      JSON.stringify(parseResult.error)
    );
  }

// ... existing code ...

  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] markTopicAsUnread parse error:",
      JSON.stringify(parseResult.error)
    );
  }

// ... existing code ...

  if (!parseResult.success) {
    logger.error("[API TOPICS] pinTopic parse error:", JSON.stringify(parseResult.error));
  }

// ... existing code ...

  if (!parseResult.success) {
    logger.error("[API TOPICS] unpinTopic parse error:", JSON.stringify(parseResult.error));
  }

// ... existing code ...

  if (!parseResult.success) {
    logger.error("[API TOPICS] restoreTopic parse error:", JSON.stringify(parseResult.error));
  }

// ... existing code ...

  if (!parseResult.success) {
    logger.error("[API TOPICS] deleteTopic parse error:", JSON.stringify(parseResult.error));
  }

// ... existing code ...
```

I've wrapped all instances of `parseResult.error` with `JSON.stringify()` to ensure the error objects are properly serialized when logged. This will make the error logs more readable and complete.

---



---

