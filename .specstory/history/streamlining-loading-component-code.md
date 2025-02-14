## SpecStory

## Streamlining Loading Component Code (1/29/2025, 2:06:41 PM)

_**User**_

clean this to just have the loading. No success or error stuff. and no need to have status props.

---

_**Assistant**_

I'll help simplify the ActivityIndicator to only handle the loading state. Here's the cleaned up version:

```typescript:features/conversation-list/conversation-list-loading.tsx
type ActivityIndicatorProps = {
  size?: number;
  color: string;
};

const useLoadingArcProgress = () => {
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

  return loadingArcProgress;
};

// ActivityIndicator component that shows a custom loading animation
const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  size = 30,
  color,
}) => {
  const internalStrokeWidth = 4;
  const loadingArcProgress = useLoadingArcProgress();

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
      90
    );
    return path;
  }, [internalStrokeWidth, size]);

  const arcTransform = useDerivedValue(() => {
    return [{ rotate: loadingArcProgress.value }];
  });

  return (
    <VStack {...debugBorder()} style={{ width: size, height: size, marginRight: 10 }}>
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
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - internalStrokeWidth / 2}
            color={color}
            opacity={0.1}
            style="stroke"
            strokeWidth={internalStrokeWidth}
          />
        </Group>
      </Canvas>
    </VStack>
  );
};
```

Key changes made:
1. Removed ActivityStatus type and status prop since we only need loading state
2. Simplified props to just size and color
3. Removed all success/error related code including SVGs and opacity animations
4. Simplified useLoadingArcProgress hook to only handle loading animation
5. Removed conditional rendering and opacity groups
6. Simplified container styling since we don't need to handle idle state anymore

The component now focuses solely on providing a smooth loading animation with a rotating arc and background circle.

---



---

