## SpecStory

## Dynamic Loader Size Adjustments (1/29/2025, 2:17:18 PM)

_**User**_

we need to alos adjust the other values depning on the size i guess no? like if i pass small we should have small strokeWidth?? no?

---

_**Assistant**_

Yes, you're right! We should adjust the `strokeWidth` and other related values proportionally based on the loader size to maintain visual consistency. Here's how we can modify the code:

```typescript:design-system/new-loader.tsx
// ... existing code ...

export const NewLoader = memo(function NewLoader({
  size = "md",
}: INewLoaderProps) {
  const sizeValue = loaderSize[size];
  // Scale strokeWidth based on size
  const strokeWidth = Math.max(sizeValue * 0.1, 2); // 10% of size, minimum 2px
  const radius = (sizeValue - strokeWidth) / 2;
  // Scale padding/margin around canvas proportionally
  const canvasPadding = sizeValue * 0.15; // 15% of size for padding
  const canvasSize = sizeValue + canvasPadding;
  // Scale blur effect based on size
  const blurAmount = Math.max(sizeValue * 0.05, 2); // 5% of size, minimum 2px

  // ... existing code ...

        <Path
          path={circle}
          color="red"
          style="stroke"
          strokeWidth={strokeWidth}
          start={startPath}
          end={1}
          strokeCap="round"
        >
          <SweepGradient
            c={vec(canvasSize / 2, canvasSize / 2)}
            colors={["cyan", "magenta", "yellow", "cyan"]}
          />
          <BlurMask blur={blurAmount} style="solid" />
        </Path>

// ... existing code ...
```

I've made the following changes:
1. Made `strokeWidth` proportional to the loader size (10% of size with a minimum of 2px)
2. Adjusted `canvasSize` padding to be proportional (15% of size)
3. Added proportional blur effect (5% of size with a minimum of 2px)

These changes will ensure that the loader maintains its visual proportions across different sizes while preventing values from becoming too small to be visible at smaller sizes.

---



---

