## SpecStory

## Resolving TypeScript 'measure' Error in React (11/20/2024, 12:53:59 PM)

_**User**_

For the code present, we get this error:
```
Property 'measure' does not exist on type 'never'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error you're encountering is due to TypeScript not being able to infer the type of `containerRef.current`. You need to explicitly define the type of the ref to ensure TypeScript knows what methods are available on it.

Here's how you can fix it by specifying the type for `containerRef`:

```typescript:components/Chat/Input/InputDumb.tsx
const containerRef = useRef<View>(null); // Import View from 'react-native'

useEffect(() => {
  if (containerRef.current) {
    containerRef.current.measure((x, y, width, height) => {
      contentHeightAV.value = height;
    });
  }
}, [replyingToMessageId, message]);
```

### Explanation:
- **Type Annotation**: By specifying `useRef<View>(null)`, you inform TypeScript that `containerRef.current` is a `View` instance, which has the `measure` method.
- **Import Statement**: Ensure you have `import { View } from 'react-native';` at the top of your file to use the `View` type.

---



---

