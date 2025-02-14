## SpecStory

## Loader Component Size Modification (1/29/2025, 2:14:07 PM)

_**User**_

chagne size number to be size with either small medium or large and default is medium and we can return a number valie with the theme using the vlaues in @loader.ts 

---

_**Assistant**_

I'll help modify the NewLoader component to use the size values from the theme. Here's the updated code:

```typescript:design-system/new-loader.tsx
// ... existing code ...

type INewLoaderProps = {
  size?: keyof ILoaderSize;
};

export const NewLoader = memo(function NewLoader({ size = "md" }: INewLoaderProps) {
  const sizeValue = loaderSize[size];
  const strokeWidth = 10;
  const radius = (sizeValue - strokeWidth) / 2;
  const canvasSize = sizeValue + 30;

  // ... existing code ...
});
```

Changes made:
1. Updated the `INewLoaderProps` type to accept `size` as an optional prop with values from `ILoaderSize` ("sm", "md", "lg")
2. Added a default value of "md" for the size prop
3. Added `sizeValue` which gets the numerical value from the `loaderSize` map
4. Updated the calculations to use `sizeValue` instead of the direct `size` prop

Don't forget to add the imports at the top of the file:
```typescript:design-system/new-loader.tsx
import { loaderSize, type ILoaderSize } from "@/theme/loader";
```

Now the NewLoader component can be used with predefined sizes like:
```typescript
<NewLoader size="sm" />
<NewLoader /> // defaults to "md"
<NewLoader size="lg" />
```

---



---

