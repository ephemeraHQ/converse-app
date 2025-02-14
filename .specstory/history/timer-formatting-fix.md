## SpecStory

## Timer Formatting Fix (1/29/2025, 1:56:50 PM)

_**User**_

fix this i want always format like "00.01.028"

---

_**Assistant**_

I'll help you modify the code to always show the format "00.01.028" (minutes.seconds.milliseconds). Here's the fix:

```typescript:features/conversation-list/conversation-list-loading.tsx
// ... existing code ...
  const countTextAV = useDerivedValue(() => {
    const count = Math.floor(counter.value);
    const minutes = Math.floor(count / 6000);
    const seconds = Math.floor((count % 6000) / 100);
    const milliseconds = count % 100;

    return `${String(minutes).padStart(2, "0")}.${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
  });
// ... existing code ...
```

The changes:
1. Added minutes calculation by dividing count by 6000 (60 seconds * 100 milliseconds)
2. Modified seconds calculation to use modulo 6000 to get remaining time after minutes
3. Formatted the string to always show two digits for minutes, two digits for seconds, and three digits for milliseconds
4. Removed the console.log and test variable since they're not needed
5. Used proper padding with padStart to ensure consistent formatting

Now the timer will display in the format "00.01.028" (minutes.seconds.milliseconds) with proper padding of zeros.

---



---

