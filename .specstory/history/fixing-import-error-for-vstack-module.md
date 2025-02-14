## SpecStory

## Fixing Import Error for VStack Module (9/26/2024, 3:10:57 PM)

_**User**_

For the code present, we get this error:
```
Cannot find module '@design-system/VStack' or its corresponding type declarations.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

To resolve the error "Cannot find module '@design-system/VStack' or its corresponding type declarations", it's likely that the import path for the VStack component is incorrect or the module is not properly installed. Here's a concise fix:

```typescript:components/TitleSubtitle.tsx
import { ITitleProps } from "@design-system/Title";
import VStack, { IVStackProps } from "@design-system/components/VStack";

export const TitleAndSubtitle = memo(function TitleAndSubtitle(props: {
```

The fix changes the import path for VStack from "@design-system/VStack" to "@design-system/components/VStack". This assumes that the VStack component is located in a "components" subdirectory within the design system package.

If this doesn't resolve the issue, you may need to:

1. Check the correct path for the VStack component in your project structure.
2. Ensure that the design system package is properly installed and up-to-date.
3. Verify that the VStack component is correctly exported from its module.

---



---

