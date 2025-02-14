## SpecStory

## Connect via Wallet Onboarding Process (10/8/2024, 12:34:14 PM)

_**User**_

remove the variables not used

---

_**Assistant**_

Certainly! I'll remove the unused variables from the code. Here are the changes:

```typescript:components/Onboarding/ConnectViaWallet.tsx
// ... existing code ...

const Content = memo(function Content() {
  const {
    signer,
    address,
    loading,
    waitingForNextSignature,
    setSigner,
    setLoading,
    setOnXmtp,
    setAlreadyV3Db,
    resetOnboarding,
  } = useConnectViaWalletStoreContext((state) => state);

  const { thirdwebSigner } = useThirdwebSigner();
  const { disconnect: disconnectWallet } = useThirdwebDisconnect();
  const thirdwebWallet = useActiveWallet();

  const disconnect = useCallback(
    async (resetLoading = true) => {
      // ... existing code ...
    },
    [address, resetOnboarding, setLoading, disconnectWallet, thirdwebWallet]
  );

  const { initXmtpClient } = useXmtpConnection();

  // ... existing code ...

  const primaryButtonAction = useCallback(() => {
    if (waitingForNextSignature) {
      setLoading(true);
    } else {
      setLoading(true);
      initXmtpClient();
    }
  }, [waitingForNextSignature, setLoading, initXmtpClient]);

  const { title, subtitle, backButton } = useUIContent();

  const showValuePropsAndTerms = !(waitingForNextSignature && !loading);

  return (
    <DeprecatedOnboardingComponent
      picto="tray"
      title={title}
      subtitle={subtitle}
      primaryButtonAction={primaryButtonAction}
      primaryButtonText={translate("connectViaWallet.sign")}
      backButtonText={backButton.text}
      backButtonAction={backButton.action}
      showTerms={showValuePropsAndTerms}
    >
      {showValuePropsAndTerms && <ValueProps />}
    </DeprecatedOnboardingComponent>
  );
});

// ... rest of the code ...
```

I've removed the following unused variables from the `Content` component:
- `signaturesDone`
- `onXmtp`
- `alreadyV3Db`
- `setAddress`
- `setSignaturesDone`
- `setWaitingForNextSignature`

These variables were destructured from the context but not used within the component. The rest of the code remains unchanged.

---



---

