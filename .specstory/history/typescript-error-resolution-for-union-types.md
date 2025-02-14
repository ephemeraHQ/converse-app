## SpecStory

## TypeScript Error Resolution for Union Types (11/12/2024, 9:48:40 AM)

_**User**_

For the code present, we get this error:
```
Type 'string | undefined' is not assignable to type 'never'.
  Type 'undefined' is not assignable to type 'never'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because the `_ensureNever` check is placed after the `switch` statement's returns, making it unreachable. To properly implement an exhaustive check, we should move it to the `default` case.

Here's the fix:

```typescript:components/Chat/Message/V3Message.tsx
      default:
        const _ensureNever: never = contentType;
        return (
          <VStack>
            <TextMessage
              fromMe={messageToDisplay.fromMe}
              hideBackground={false}
              content={contentType + message.deliveryStatus + index}
            />
          </VStack>
        );
    }
  }
);
```

This ensures that if we miss any content type in our switch statement, TypeScript will give us a compile-time error. Remove the line after the switch statement since it's no longer needed.

---



---

