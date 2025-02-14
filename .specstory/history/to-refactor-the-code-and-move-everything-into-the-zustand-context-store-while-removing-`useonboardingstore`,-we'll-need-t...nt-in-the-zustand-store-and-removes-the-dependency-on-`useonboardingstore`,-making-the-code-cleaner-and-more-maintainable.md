## SpecStory

## To refactor the code and move everything into the Zustand context store while removing `useOnboardingStore`, we'll need to make several changes. Here's a simplified version of the code with the necessary modifications:

```typescript
// components/Onboarding/ConnectViaWallet.tsx
import { translate } from "@i18n";
import { createContext, useContext, memo } from "react";
import { createStore, useStore } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { awaitableAlert } from "@utils/alert";
import { getDatabaseFilesForInboxId } from "@utils/fileSystem";
import logger from "@utils/logger";
import { logoutAccount } from "@utils/logout";
import { sentryTrackMessage } from "@utils/sentry";
import { thirdwebClient } from "@utils/thirdweb";
import { Signer } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, Text } from "react-native";
import { ethers5Adapter } from "thirdweb/adapters/ethers5";
import { ethereum } from "thirdweb/chains";
import {
  useActiveAccount,
  useActiveWallet,
  useDisconnect as useThirdwebDisconnect,
} from "thirdweb/react";

import {
  getAccountsList,
  useAccountsStore,
} from "../../data/store/accountsStore";
import { isOnXmtp } from "../../utils/xmtpRN/client";
import {
  getInboxId,
  getXmtpBase64KeyFromSigner,
} from "../../utils/xmtpRN/signIn";
import DeprecatedOnboardingComponent from "./DeprecatedOnboardingComponent";
import ValueProps from "./ValueProps";
import { connectWithBase64Key } from "./init-xmtp-client";
import { useAppStateHandlers } from "../../hooks/useAppStateHandlers";

type IConnectViaWalletStoreState = {
  signer: Signer | undefined;
  address: string | undefined;
  loading: boolean;
  signaturesDone: number;
  waitingForNextSignature: boolean;
  onXmtp: boolean;
  alreadyV3Db: boolean;
  setSigner: (signer: Signer | undefined) => void;
  setAddress: (address: string | undefined) => void;
  setLoading: (loading: boolean) => void;
  setSignaturesDone: (signaturesDone: number) => void;
  setWaitingForNextSignature: (waiting: boolean) => void;
  setOnXmtp: (onXmtp: boolean) => void;
  setAlreadyV3Db: (alreadyV3Db: boolean) => void;
  resetOnboarding: () => void;
};

const createConnectViaWalletStore = () => 
  createStore<IConnectViaWalletStoreState>()((set) => ({
    signer: undefined,
    address: undefined,
    loading: false,
    signaturesDone: 0,
    waitingForNextSignature: false,
    onXmtp: false,
    alreadyV3Db: false,
    setSigner: (signer) => set({ signer }),
    setAddress: (address) => set({ address }),
    setLoading: (loading) => set({ loading }),
    setSignaturesDone: (signaturesDone) => set({ signaturesDone }),
    setWaitingForNextSignature: (waiting) => set({ waitingForNextSignature: waiting }),
    setOnXmtp: (onXmtp) => set({ onXmtp }),
    setAlreadyV3Db: (alreadyV3Db) => set({ alreadyV3Db }),
    resetOnboarding: () => set({
      signer: undefined,
      address: undefined,
      loading: false,
      signaturesDone: 0,
      waitingForNextSignature: false,
      onXmtp: false,
      alreadyV3Db: false,
    }),
  }));

const ConnectViaWalletStoreContext = createContext<IConnectViaWalletStoreState | null>(null);

const useConnectViaWalletStore = () => {
  const store = useContext(ConnectViaWalletStoreContext);
  if (!store) throw new Error("Missing ConnectViaWalletStore.Provider in the tree");
  return store;
};

const ConnectViaWalletStoreProvider = memo(({ children }) => {
  const store = createConnectViaWalletStore();
  return (
    <ConnectViaWalletStoreContext.Provider value={store}>
      {children}
    </ConnectViaWalletStoreContext.Provider>
  );
});

function useThirdwebSigner() {
  const thirdwebAccount = useActiveAccount();
  const [thirdwebSigner, setThirdwebSigner] = useState<Signer | undefined>();

  useEffect(() => {
    if (thirdwebAccount) {
      ethers5Adapter.signer
        .toEthers({
          client: thirdwebClient,
          chain: ethereum,
          account: thirdwebAccount,
        })
        .then(setThirdwebSigner);
    } else {
      setThirdwebSigner(undefined);
    }
  }, [thirdwebAccount]);

  return { thirdwebSigner };
}

function useXmtpConnection({
  signer,
  address,
  disconnect,
  setLoading,
  setWaitingForNextSignature,
  setSignaturesDone,
}) {
  const [onXmtp, setOnXmtp] = useState(false);
  const [alreadyV3Db, setAlreadyV3Db] = useState(false);
  const inXmtpClientCreationFlow = useRef(false);
  const initiatingClientFor = useRef<string | undefined>(undefined);
  const clickedSignature = useRef(false);

  const waitForClickSignature = useCallback(async () => {
    while (!clickedSignature.current) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }, []);

  const initXmtpClient = useCallback(async () => {
    if (!signer || !address || initiatingClientFor.current === address) {
      return;
    }
    initiatingClientFor.current = address;
    let onboardingDone = false;
    setTimeout(() => {
      if (onboardingDone === false) {
        sentryTrackMessage("Onboarding took more than 30 seconds");
      }
    }, 30000);

    try {
      logger.debug("[Onboarding] Connecting to XMTP using an external wallet");
      inXmtpClientCreationFlow.current = true;
      const base64Key = await getXmtpBase64KeyFromSigner(
        signer,
        async () => {
          await awaitableAlert(
            translate("current_installation_revoked"),
            translate("current_installation_revoked_description")
          );
          disconnect();
        },
        async () => {
          logger.debug("[Onboarding] Triggering create signature");
          setWaitingForNextSignature(true);
          clickedSignature.current = false;
        },
        async () => {
          setSignaturesDone((s) => s + 1);
          setLoading(false);
          logger.debug("Waiting until signature click for Enable");
          await waitForClickSignature();
          logger.debug("Click on Sign done for Enable");
          logger.debug("[Onboarding] Triggering enable signature");
          if (onXmtp && !alreadyV3Db) {
            logger.debug(
              "Already on XMTP, but not db present, will need a new signature"
            );
            setWaitingForNextSignature(true);
          } else {
            logger.debug(
              "New to XMTP, or db already present, will not need a new signature"
            );
            setWaitingForNextSignature(false);
          }
        },
        async () => {
          setSignaturesDone((s) => s + 1);
          setLoading(false);
          logger.debug("Waiting until signature click for Authenticate");
          await waitForClickSignature();
          logger.debug("Click on Sign done for Authenticate");
          setWaitingForNextSignature(false);
          logger.debug(
            "[Onboarding] Triggering authenticate to inbox signature"
          );
        }
      );
      inXmtpClientCreationFlow.current = false;
      if (!base64Key) return;
      logger.debug("[Onboarding] Got base64 key, now connecting");
      await connectWithBase64Key({
        address,
        base64Key,
        connectionMethod: "wallet",
        privyAccountId: "",
        isEphemeral: false,
        pkPath: "",
      });
      logger.info("[Onboarding] Successfully logged in using a wallet");
      onboardingDone = true;
    } catch (e) {
      initiatingClientFor.current = undefined;
      setLoading(false);
      clickedSignature.current = false;
      setWaitingForNextSignature(false);
      logger.error(e);
    }
  }, [
    address,
    alreadyV3Db,
    disconnect,
    onXmtp,
    setLoading,
    signer,
    waitForClickSignature,
  ]);

  return { onXmtp, alreadyV3Db, initXmtpClient, setOnXmtp, setAlreadyV3Db };
}

const Content = memo(function Content() {
  const {
    signer,
    address,
    loading,
    signaturesDone,
    waitingForNextSignature,
    onXmtp,
    alreadyV3Db,
    setSigner,
    setAddress,
    setLoading,
    setSignaturesDone,
    setWaitingForNextSignature,
    setOnXmtp,
    setAlreadyV3Db,
    resetOnboarding,
  } = useConnectViaWalletStore();

  const { thirdwebSigner } = useThirdwebSigner();
  const { disconnect: disconnectWallet } = useThirdwebDisconnect();
  const thirdwebWallet = useActiveWallet();

  const disconnect = useCallback(
    async (resetLoading = true) => {
      logger.debug("[Onboarding] Logging out");
      if (address) {
        logoutAccount(address, false, true, () => {}, () => {});
      }
      resetOnboarding();
      if (resetLoading) {
        setLoading(false);
      }
      if (thirdwebWallet) {
        await disconnectWallet(thirdwebWallet);
      }
      const storageKeys = await AsyncStorage.getAllKeys();
      const wcKeys = storageKeys.filter((k) => k.startsWith("wc@2:"));
      await AsyncStorage.multiRemove(wcKeys);
    },
    [address, resetOnboarding, setLoading, disconnectWallet, thirdwebWallet]
  );

  const { initXmtpClient } = useXmtpConnection({
    signer,
    address,
    disconnect,
    setLoading,
    setWaitingForNextSignature,
    setSignaturesDone,
  });

  useEffect(() => {
    if (thirdwebSigner) {
      (async () => {
        try {
          const a = await thirdwebSigner.getAddress();
          if (getAccountsList().includes(a)) {
            Alert.alert(
              translate("connectViaWallet.alreadyConnected.title"),
              translate("connectViaWallet.alreadyConnected.message")
            );
            disconnect();
            useAccountsStore.getState().setCurrentAccount(a, false);
            return;
          }
          const isOnNetwork = await isOnXmtp(a);
          setOnXmtp(isOnNetwork);
          const inboxId = await getInboxId(a);
          const v3Dbs = await getDatabaseFilesForInboxId(inboxId);
          setAlreadyV3Db(
            v3Dbs.filter((n) => n.name.endsWith(".db3")).length > 0
          );
          setSigner(thirdwebSigner);
          setLoading(false);
          logger.debug(
            `[Onboarding] User connected wallet (${a}). ${
              isOnNetwork ? "Already" : "Not yet"
            } on XMTP. V3 database ${
              v3Dbs.length > 0 ? "already" : "not"
            } present`
          );
        } catch (e) {
          logger.error(e, { context: "Handling thirdweb signer" });
        }
      })();
    }
  }, [thirdwebSigner, setSigner, setLoading, disconnect, setOnXmtp, setAlreadyV3Db]);

  const primaryButtonAction = useCallback(() => {
    if (waitingForNextSignature) {
      setLoading(true);
    } else {
      setLoading(true);
      initXmtpClient();
    }
  }, [waitingForNextSignature, setLoading, initXmtpClient]);

  const { title, subtitle, backButton } = useUIContent({
    signer,
    address,
    onXmtp,
    alreadyV3Db,
    waitingForNextSignature,
    loading,
    signaturesDone,
    disconnect,
  });

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

export function ConnectViaWallet() {
  return (
    <ConnectViaWalletStoreProvider>
      <Content />
    </ConnectViaWalletStoreProvider>
  );
}
```

### Key Changes Made:
1. **Zustand Store Creation**: The Zustand store is created with all necessary state and actions, including `signer`, `address`, `loading`, `signaturesDone`, `waitingForNextSignature`, `onXmtp`, and `alreadyV3Db`.

2. **Context Provider**: A context provider (`ConnectViaWalletStoreProvider`) wraps the `Content` component, providing access to the Zustand store.

3. **State Management**: The `Content` component now uses the Zustand store to manage its state instead of relying on `useOnboardingStore`.

4. **Disconnect Logic**: The disconnect logic is integrated into the `Content` component, utilizing the store's actions.

5. **Effect Hook**: The effect hook that checks the `thirdwebSigner` and updates the state is simplified to use the Zustand store.

This refactor centralizes the state management in the Zustand store and removes the dependency on `useOnboardingStore`, making the code cleaner and more maintainable. (10/8/2024, 12:27:20 PM)

_**User**_

refactor to put everything in the zustand context store and remvoe useOnboardingStore

---

_**Assistant**_

To refactor the code and move everything into the Zustand context store while removing `useOnboardingStore`, we'll need to make several changes. Here's a simplified version of the code with the necessary modifications:

```typescript:components/Onboarding/ConnectViaWallet.tsx
// ... (keep existing imports)

type IConnectViaWalletStoreState = {
  signer: Signer | undefined;
  address: string | undefined;
  loading: boolean;
  signaturesDone: number;
  waitingForNextSignature: boolean;
  onXmtp: boolean;
  alreadyV3Db: boolean;
  setSigner: (signer: Signer | undefined) => void;
  setAddress: (address: string | undefined) => void;
  setLoading: (loading: boolean) => void;
  setSignaturesDone: (signaturesDone: number) => void;
  setWaitingForNextSignature: (waiting: boolean) => void;
  setOnXmtp: (onXmtp: boolean) => void;
  setAlreadyV3Db: (alreadyV3Db: boolean) => void;
  resetOnboarding: () => void;
};

const createConnectViaWalletStore = () => 
  createStore<IConnectViaWalletStoreState>()((set) => ({
    signer: undefined,
    address: undefined,
    loading: false,
    signaturesDone: 0,
    waitingForNextSignature: false,
    onXmtp: false,
    alreadyV3Db: false,
    setSigner: (signer) => set({ signer }),
    setAddress: (address) => set({ address }),
    setLoading: (loading) => set({ loading }),
    setSignaturesDone: (signaturesDone) => set({ signaturesDone }),
    setWaitingForNextSignature: (waiting) => set({ waitingForNextSignature: waiting }),
    setOnXmtp: (onXmtp) => set({ onXmtp }),
    setAlreadyV3Db: (alreadyV3Db) => set({ alreadyV3Db }),
    resetOnboarding: () => set({
      signer: undefined,
      address: undefined,
      loading: false,
      signaturesDone: 0,
      waitingForNextSignature: false,
      onXmtp: false,
      alreadyV3Db: false,
    }),
  }));

// ... (keep ConnectViaWalletStoreContext and related functions)

const Content = memo(function Content() {
  const store = useConnectViaWalletStore();
  const {
    signer,
    address,
    loading,
    signaturesDone,
    waitingForNextSignature,
    onXmtp,
    alreadyV3Db,
    setSigner,
    setAddress,
    setLoading,
    setSignaturesDone,
    setWaitingForNextSignature,
    setOnXmtp,
    setAlreadyV3Db,
    resetOnboarding,
  } = useConnectViaWalletStoreContext((state) => state);

  const { thirdwebSigner } = useThirdwebSigner();
  const { disconnect: disconnectWallet } = useThirdwebDisconnect();
  const thirdwebWallet = useActiveWallet();

  const disconnect = useCallback(
    async (resetLoading = true) => {
      logger.debug("[Onboarding] Logging out");
      if (address) {
        logoutAccount(address, false, true, () => {}, () => {});
      }
      resetOnboarding();
      if (resetLoading) {
        setLoading(false);
      }
      if (thirdwebWallet) {
        await disconnectWallet(thirdwebWallet);
      }
      const storageKeys = await AsyncStorage.getAllKeys();
      const wcKeys = storageKeys.filter((k) => k.startsWith("wc@2:"));
      await AsyncStorage.multiRemove(wcKeys);
    },
    [address, resetOnboarding, setLoading, disconnectWallet, thirdwebWallet]
  );

  const { initXmtpClient } = useXmtpConnection({
    signer,
    address,
    disconnect,
    setLoading,
    setWaitingForNextSignature,
    setSignaturesDone,
    onXmtp,
    alreadyV3Db,
    setOnXmtp,
    setAlreadyV3Db,
  });

  // ... (keep existing useEffect hooks)

  const primaryButtonAction = useCallback(() => {
    if (waitingForNextSignature) {
      setLoading(true);
    } else {
      setLoading(true);
      initXmtpClient();
    }
  }, [waitingForNextSignature, setLoading, initXmtpClient]);

  const { title, subtitle, backButton } = useUIContent({
    signer,
    address,
    onXmtp,
    alreadyV3Db,
    waitingForNextSignature,
    loading,
    signaturesDone,
    disconnect,
  });

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

// ... (keep existing ConnectViaWallet and ConnectViaWalletStoreProvider components)
```

This refactored version moves all the state management into the Zustand store and removes the dependency on `useOnboardingStore`. The main changes are:

1. We've expanded the `IConnectViaWalletStoreState` to include all the necessary state and actions.
2. The `createConnectViaWalletStore` function now includes all the state and actions that were previously managed by `useOnboardingStore`.
3. In the `Content` component, we now use `useConnectViaWalletStoreContext` to access all the state and actions from the store.
4. The `disconnect` function has been moved into the `Content` component and uses the store's actions.
5. The `useXmtpConnection` hook now receives all its dependencies from the store.

These changes centralize the state management in the Zustand store and remove the need for `useOnboardingStore`. You may need to adjust some other parts of the code that were using `useOnboardingStore` to use the new store instead.

---



---

