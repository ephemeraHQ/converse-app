## SpecStory

## Fixing Text Width in Counter Component (1/29/2025, 2:01:42 PM)

_**User**_

the text is moving because of how large number dissplaed are. possible to have a fixed with for the textY?

---

_**Assistant**_

Yes, we can modify the Counter component to have a fixed width for the text. We can wrap the AnimatableText in a Center component with a fixed width to ensure consistent spacing. Here's how to update it:

```typescript:features/conversation-list/conversation-list-loading.tsx
// ... existing code ...

const Counter = memo(function Counter() {
  const counterAV = useSharedValue(0);

  useEffect(() => {
    counterAV.value = 0;
    counterAV.value = withTiming(10, {
      duration: 10000,
      easing: Easing.linear,
    });

    return () => {
      cancelAnimation(counterAV);
    };
  }, []);

  const countTextAV = useDerivedValue(() => {
    const count = counterAV.value;
    const minutes = 0;
    const seconds = Math.floor(count);
    const milliseconds = Math.floor((count % 1) * 1000);

    return `${String(minutes).padStart(2, "0")}.${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
  });

  return (
    <Center style={{ width: 150 }}>
      <AnimatableText text={countTextAV} />
    </Center>
  );
});

// ... existing code ...
```

This change wraps the AnimatableText in a Center component with a fixed width of 150 units. This will prevent the text container from changing size as the numbers update. You can adjust the width value (150) to whatever works best for your specific case.

---

_**User**_

fix. tried this and not wokring with textAlign and alignSelf...

---

_**Assistant**_

Let's fix the styling by applying the styles directly to the AnimatableText component:

```typescript:features/conversation-list/conversation-list-loading.tsx
// ... existing code ...

const Counter = memo(function Counter() {
  const counterAV = useSharedValue(0);

  useEffect(() => {
    counterAV.value = 0;
    counterAV.value = withTiming(10, {
      duration: 10000,
      easing: Easing.linear,
    });

    return () => {
      cancelAnimation(counterAV);
    };
  }, []);

  const countTextAV = useDerivedValue(() => {
    const count = counterAV.value;
    const minutes = 0;
    const seconds = Math.floor(count);
    const milliseconds = Math.floor((count % 1) * 1000);

    return `${String(minutes).padStart(2, "0")}.${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
  });

  return (
    <AnimatableText
      style={{
        width: 150,
        textAlign: "center",
        alignSelf: "center",
      }}
      text={countTextAV}
    />
  );
});

// ... existing code ...
```

This will:
1. Set a fixed width of 150
2. Center the text within that width using textAlign
3. Center the component itself using alignSelf

The text should now stay centered and maintain a consistent width as the numbers change.

---

_**User**_

no, text is still moving..

---

_**Assistant**_

The issue might be that we need to use a monospace font to ensure each character takes up the same width. Let's modify the AnimatableText to use a monospace font:

```typescript:features/conversation-list/conversation-list-loading.tsx
// ... existing code ...

const Counter = memo(function Counter() {
  const counterAV = useSharedValue(0);

  useEffect(() => {
    counterAV.value = 0;
    counterAV.value = withTiming(10, {
      duration: 10000,
      easing: Easing.linear,
    });

    return () => {
      cancelAnimation(counterAV);
    };
  }, []);

  const countTextAV = useDerivedValue(() => {
    const count = counterAV.value;
    const minutes = 0;
    const seconds = Math.floor(count);
    const milliseconds = Math.floor((count % 1) * 1000);

    return `${String(minutes).padStart(2, "0")}.${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
  });

  return (
    <AnimatableText
      style={{
        width: 150,
        textAlign: "center",
        alignSelf: "center",
        fontFamily: "monospace", // Add monospace font
        fontVariant: ["tabular-nums"], // Use monospace numbers
      }}
      text={countTextAV}
    />
  );
});

// ... existing code ...
```

This change adds:
1. A monospace font family
2. `fontVariant: ["tabular-nums"]` which ensures all numbers have the same width

This should prevent the text from shifting as different numbers are displayed.

---

_**User**_

wow never saw tabluar-nums , can you write a small comment beside it exapling what it is

---

_**Assistant**_



```typescript:features/conversation-list/conversation-list-loading.tsx
// ... existing code ...

const Counter = memo(function Counter() {
  // ... existing code ...

  return (
    <AnimatableText
      style={{
        width: 150,
        textAlign: "center",
        alignSelf: "center",
        // fontFamily: "monospace",
        fontVariant: ["tabular-nums"], // Uses monospaced numbers where all digits have the same width (e.g., '1' and '8' take up equal space)
      }}
      text={countTextAV}
    />
  );
});

// ... existing code ...
```

I've added a comment explaining that `tabular-nums` is a font feature that ensures all numerical digits have the same width, which prevents layout shifts when numbers change. I also commented out the `fontFamily` since `tabular-nums` alone should be sufficient for our needs.

---



---

