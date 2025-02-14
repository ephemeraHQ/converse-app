## SpecStory

## Using useEffect for Streaming Subscriptions (1/28/2025, 2:40:58 PM)

_**User**_

should setupStreamingSubscriptions be called in App in a useEffect or just at root like this?

---

_**Assistant**_

Since `setupStreamingSubscriptions()` is setting up event subscriptions, it should be called within a `useEffect` hook in the App component. This ensures proper setup and cleanup of subscriptions, and follows React best practices for side effects.

Here's how to modify the code:

```typescript:App.tsx
// ... existing code ...

const App = () => {
  const styles = useStyles();
  const debugRef = useRef();

  useEffect(() => {
    setupAppAttest();
  }, []);

  useEffect(() => {
    setupStreamingSubscriptions();
  }, []);

  useCoinbaseWalletListener(true, coinbaseUrl);
// ... existing code ...
```

The reasons for this change:
1. Side effects like setting up subscriptions should be managed within React's lifecycle
2. If `setupStreamingSubscriptions` needs cleanup (like unsubscribing), you can return a cleanup function in the `useEffect`
3. It ensures the subscriptions are set up after the component mounts and the React environment is ready
4. If the App component unmounts and remounts, the subscriptions will be properly re-initialized

The current implementation at the root level will run once when the file is imported, which might be too early in the application lifecycle and doesn't follow React's component lifecycle patterns.

---



---

