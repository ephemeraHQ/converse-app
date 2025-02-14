## SpecStory

## Code Refactoring for App.tsx (2/6/2025, 9:53:30 PM)

_**User**_

fix

---

_**Assistant**_

I'll help improve the code organization and readability in App.tsx. Here are the suggested changes:

```typescript:App.tsx
// ... existing imports ...

// Move configuration code to the top level
if (__DEV__) {
  require("./ReactotronConfig.ts");
}

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

configureCoinbase({
  callbackURL: new URL(`https://${config.websiteDomain}/coinbase`),
  hostURL: new URL("https://wallet.coinbase.com/wsegue"),
  hostPackageName: "org.toshi",
});

initSentry();
saveApiURI();

const coinbaseUrl = new URL(`https://${config.websiteDomain}/coinbase`);

// Move LogBox configuration to a separate function
function configureLogBox() {
  LogBox.ignoreLogs([
    "Privy: Expected status code 200, received 400",
    "Error destroying session",
    'event="noNetwork',
    "[Reanimated] Reading from `value` during component render.",
    "Attempted to import the module",
    'Attempted to import the module "/Users',
    "Falling back to file-based resolution.",
    "Couldn't find real values for `KeyboardContext`.",
    "sync worker error storage error: Pool needs to  reconnect before use",
    "[Converse.debug.dylib] sync worker error storage error: Pool needs to  reconnect before use",
    "Falling back to file-based resolution.",
  ]);
}

configureLogBox();

// Move App component to a separate function with clear responsibilities
function App() {
  const styles = useStyles();
  const debugRef = useRef();

  // Setup effects
  useEffect(() => {
    setupAppAttest();
    setupStreamingSubscriptions();
  }, []);

  useEffect(() => {
    registerBackgroundFetchTask();
  }, []);

  // Handle debug menu
  const showDebugMenu = useCallback(() => {
    if (!debugRef.current?.showDebugMenu) return;
    debugRef.current.showDebugMenu();
  }, []);

  useEffect(() => {
    converseEventEmitter.on("showDebugMenu", showDebugMenu);
    return () => converseEventEmitter.off("showDebugMenu", showDebugMenu);
  }, [showDebugMenu]);

  // Handle auth status
  useEffect(() => {
    const currentAccount = useAccountsStore.getState().currentAccount;
    setAuthStatus(
      currentAccount && currentAccount !== TEMPORARY_ACCOUNT_NAME
        ? "signedIn"
        : "signedOut"
    );
  }, []);

  useCoinbaseWalletListener(true, coinbaseUrl);

  useAppStateHandlers({
    onBackground: () => logger.debug("App is in background"),
    onForeground: () => logger.debug("App is in foreground"),
    onInactive: () => logger.debug("App is inactive"),
  });

  return (
    <View style={styles.safe}>
      <Main />
      <DebugButton ref={debugRef} />
    </View>
  );
}

// Platform-specific keyboard provider
const AppKeyboardProvider = Platform.OS === "ios" ? KeyboardProvider : React.Fragment;

// ... rest of the code remains the same ...
```

The changes include:

1. Moved configuration code to the top level for better organization
2. Created a separate function for LogBox configuration
3. Cleaned up the App component by:
   - Grouping related effects together
   - Simplifying the auth status check
   - Making the event handler code more concise
4. Added descriptive comments to separate logical sections
5. Simplified the AppKeyboardProvider declaration
6. Removed unnecessary comments and improved code readability

The rest of the code (AppWithProviders and useStyles) remains unchanged as it was already well-organized.

These changes make the code more maintainable and easier to understand while following the provided style guide.

---



---

