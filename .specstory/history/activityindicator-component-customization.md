## SpecStory

## ActivityIndicator Component Customization (1/29/2025, 2:11:15 PM)

_**User**_

don't use exteranl hook, put everything in activeyIndicator component. Also make the arc 3/4 of the full circle. Don't have a background

---

_**Assistant**_

I'll help modify the ActivityIndicator component to include the animation logic internally and adjust the arc to be 3/4 of a circle (270 degrees) without the background circle. Here's the updated code:

```typescript:features/conversation-list/conversation-list-loading.tsx
// ... existing code ...

type ActivityIndicatorProps = {
  size?: number;
  color: string;
};

const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({ size = 30 }) => {
  const { theme } = useAppTheme();
  const color = theme.colors.text.primary;
  const internalStrokeWidth = 4;
  const loadingArcProgress = useSharedValue(0);

  useEffect(() => {
    loadingArcProgress.value = withRepeat(
      withTiming(6 * Math.PI, {
        duration: 2100,
        easing: Easing.bezier(0.35, 0.7, 0.29, 0.32),
      }),
      -1,
      false
    );

    return () => {
      cancelAnimation(loadingArcProgress);
    };
  }, []);

  const arcPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc(
      rect(
        internalStrokeWidth / 2,
        internalStrokeWidth / 2,
        size - internalStrokeWidth,
        size - internalStrokeWidth
      ),
      0,
      270 // Changed from 90 to 270 degrees for 3/4 circle
    );
    return path;
  }, [internalStrokeWidth, size]);

  const arcTransform = useDerivedValue(() => {
    return [{ rotate: loadingArcProgress.value }];
  });

  return (
    <VStack style={{ width: size, height: size, marginRight: 10 }}>
      <Canvas
        style={{
          height: size,
          aspectRatio: 1,
          borderRadius: size / 2,
        }}
      >
        <Group>
          <Group
            origin={{
              x: size / 2,
              y: size / 2,
            }}
            transform={arcTransform}
          >
            <Path
              path={arcPath}
              strokeWidth={internalStrokeWidth}
              style={"stroke"}
              color={color}
              strokeCap={"round"}
            />
          </Group>
        </Group>
      </Canvas>
    </VStack>
  );
};

// ... existing code ...
```

Key changes made:
1. Removed the `useLoadingArcProgress` hook and moved its logic directly into the `ActivityIndicator` component
2. Changed the arc angle from 90 to 270 degrees to make it 3/4 of a circle
3. Removed the background `Circle` component
4. Kept the same animation timing and easing for smooth rotation

---



---

