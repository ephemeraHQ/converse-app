## SpecStory

## Countdown Timer in Milliseconds (1/29/2025, 10:15:00 AM)

_**User**_

i want to show a countodwn in ms like "00.01.028" and the numbers goes up

---

_**Assistant**_

I'll help you modify the code to show a countdown timer in milliseconds format. We'll use `useDerivedValue` to create an animated counter.

```typescript:features/conversation-list/conversation-list-loading.tsx
// ... existing code ...

const countTextAV = useDerivedValue(() => {
  // Format time as "00.00.000"
  const timeInMs = Date.now() % 60000; // Get milliseconds within a minute
  const seconds = Math.floor(timeInMs / 1000);
  const milliseconds = timeInMs % 1000;
  
  return `${String(Math.floor(seconds / 10)).padStart(1, '0')}${seconds % 10}.${String(milliseconds).padStart(3, '0')}`;
}, []);

// ... existing code ...

      <Center
        {...debugBorder()}
        style={[
          $globalStyles.absoluteFill,
          {
            bottom: headerHeight + insets.top,
          },
        ]}
      >
        <Loader />
        <Text>Hello</Text>
        <Text>Gathering your messages</Text>
        <AnimatedText text={countTextAV}/>
      </Center>
// ... existing code ...
```

This update will:
1. Create a continuously updating timer using `useDerivedValue`
2. Format the time as "SS.MMM" where S is seconds and M is milliseconds
3. The timer will count up from 0 and reset every minute
4. Fixed the typo in "Gathering" your messages
5. Added the `countTextAV` to the `AnimatedText` component

The timer will automatically update because `useDerivedValue` is used with Reanimated's animation system. The format will look like "00.000" and count up continuously.

---



---

