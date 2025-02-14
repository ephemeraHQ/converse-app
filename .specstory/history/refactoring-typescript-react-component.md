## SpecStory

## Refactoring TypeScript React Component (2/6/2025, 9:53:12 PM)

_**User**_

fix

---

_**Assistant**_

I'll help improve this code following the style guide. Here are the key changes needed:

```typescript:App.tsx
// ... existing code ...

// Move to a separate types file
type IAppStateHandlers = {
  onBackground: () => void;
  onForeground: () => void;
  onInactive: () => void;
};

// Rename to use function keyword and add type
function App() {
  const styles = useStyles();
  const debugRef = useRef<any>(); // Should be properly typed

  // Group related effects together
  useEffect(() => {
    setupAppAttest();
    setupStreamingSubscriptions();
    registerBackgroundFetchTask();
  }, []);

  const showDebugMenu = useCallback(() => {
    debugRef.current?.showDebugMenu?.();
  }, []);

  useEffect(() => {
    converseEventEmitter.on("showDebugMenu", showDebugMenu);
    return () => {
      converseEventEmitter.off("showDebugMenu", showDebugMenu);
    };
  }, [showDebugMenu]);

  useEffect(() => {
    const currentAccount = useAccountsStore.getState().currentAccount;
    setAuthStatus(
      currentAccount && currentAccount !== TEMPORARY_ACCOUNT_NAME
        ? "signedIn"
        : "signedOut"
    );
  }, []);

  useCoinbaseWalletListener(true, coinbaseUrl);

  // Use object params for handlers
  useAppStateHandlers({
    onBackground: () => logger.debug("App is in background"),
    onForeground: () => logger.debug("App is in foreground"),
    onInactive: () => logger.debug("App is inactive"),
  } satisfies IAppStateHandlers);

  return (
    <View style={styles.safe}>
      <Main />
      <DebugButton ref={debugRef} />
    </View>
  );
}

// ... existing code ...

// Move styles to use theme
function useStyles() {
  const { theme } = useAppTheme();
  
  return useMemo(
    () =>
      StyleSheet.create({
        safe: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
      }),
    [theme]
  );
}
```

Key changes made:

1. Adde

---



---

