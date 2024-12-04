import { Button } from "@design-system/Button/Button";
import { translate } from "@i18n";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";
import { memo, useCallback, useRef } from "react";
import { ActivityIndicator } from "react-native";

import { Center } from "../../../design-system/Center";
import { VStack } from "../../../design-system/VStack";
import { useRouter } from "../../../navigation/useNavigation";
import { useAppTheme } from "../../../theme/useAppTheme";
import { PictoTitleSubtitle } from "../../PictoTitleSubtitle";
import { Terms } from "../Terms";
import ValueProps from "../ValueProps";
import { ConnectViaWalletContextProvider } from "./ConnectViaWallet.context";
import {
  ConnectViaWalletStoreProvider,
  useConnectViaWalletStore,
  useConnectViaWalletStoreContext,
} from "./ConnectViaWallet.store";
import { useConnectViaWalletDisconnect } from "./useConnectViaWalletDisconnect";
import { useInitXmptClient } from "./useConnectViaWalletInitXmtpClient";
import { useInitConnectViaWalletState } from "./useInitConnectViaWalletState";

type IConnectViaWalletProps = {
  address: string;
  onDoneConnecting: () => void;
  onErrorConnecting: (arg: { error: Error }) => void;
};

export const ConnectViaWallet = memo(function ConnectViaWallet(
  props: IConnectViaWalletProps
) {
  const { address, onErrorConnecting, onDoneConnecting } = props;

  const finishedConnectingRef = useRef(false);

  const disconnect = useConnectViaWalletDisconnect();

  useRouter({
    onBeforeRemove: () => {
      // Before we leave, make sure the user completed the flow otherwise disconnect
      if (!finishedConnectingRef.current) {
        disconnect({ address });
      }
    },
    onFocus() {
      // Edge case: User already connected wallet and finished the flow but decided to come back here
      if (finishedConnectingRef.current) {
        onErrorConnecting({ error: new Error("User went back") });
      }
    },
  });

  const handleDoneConnecting = useCallback(() => {
    finishedConnectingRef.current = true;
    onDoneConnecting();
  }, [onDoneConnecting]);

  const handleErrorConnecting = useCallback(
    (arg: { error: Error }) => {
      // When something went wrong, let's be safe and disconnect
      disconnect({ address }).catch(sentryTrackError);
      onErrorConnecting(arg);
    },
    [onErrorConnecting, disconnect, address]
  );

  return (
    <ConnectViaWalletContextProvider
      onDoneConnecting={handleDoneConnecting}
      onErrorConnecting={handleErrorConnecting}
    >
      <ConnectViaWalletStateWrapper address={address} />
    </ConnectViaWalletContextProvider>
  );
});

// Wrapper to init the wallet state and then provide the data to the UI
const ConnectViaWalletStateWrapper = memo(
  function ConnectViaWalletStateWrapper({ address }: { address: string }) {
    const { isInitializing, alreadyV3Db, signer } =
      useInitConnectViaWalletState({ address });

    if (isInitializing) {
      return <LoadingState />;
    }

    if (!signer) {
      // TODO: Empty state something went wrong
      return null;
    }

    return (
      <ConnectViaWalletStoreProvider
        address={address}
        alreadyV3Db={alreadyV3Db}
        signer={signer}
      >
        <ConnectViaWalletUI />
      </ConnectViaWalletStoreProvider>
    );
  }
);

const ConnectViaWalletUI = memo(function ConnectViaWalletUI(props: object) {
  const { theme } = useAppTheme();

  const {
    address,
    loading,
    waitingForNextSignature,
    signer,
    alreadyV3Db,
    signaturesDone,
  } = useConnectViaWalletStoreContext((state) => ({
    address: state.address,
    loading: state.loading,
    waitingForNextSignature: state.waitingForNextSignature,
    signer: state.signer,
    alreadyV3Db: state.alreadyV3Db,
    signaturesDone: state.numberOfSignaturesDone,
  }));

  const connectViewWalletStore = useConnectViaWalletStore();

  const { initXmtpClient } = useInitXmptClient();

  const primaryButtonAction = useCallback(() => {
    if (waitingForNextSignature) {
      logger.debug("[Connect Wallet] User clicked on second sign button");
      connectViewWalletStore.getState().setLoading(true);
      connectViewWalletStore.getState().setClickedSignature(true);
    } else {
      logger.debug("[Connect Wallet] User clicked on initial sign button");
      connectViewWalletStore.getState().setLoading(true);
      initXmtpClient();
    }
  }, [waitingForNextSignature, connectViewWalletStore, initXmtpClient]);

  if (!signer || !address) {
    return null;
  }

  // Random for now until we have a better solution
  if (loading) {
    return <LoadingState />;
  }

  // Determine the content based on the state
  let title = "";
  let subtitle = "";
  let showValueProps = true;

  // On XMTP, needs V3 DB signature
  if (!alreadyV3Db) {
    title = translate("connectViaWallet.sign");
    subtitle = translate("connectViaWallet.firstSignature.explanation");
  }
  // On XMTP, has V3 DB signature
  else if (alreadyV3Db) {
    title = translate("connectViaWallet.firstSignature.title");
    subtitle = translate("connectViaWallet.firstSignature.explanation");
  }

  return (
    <>
      <PictoTitleSubtitle.Container
        // Not best to add those style here but okay for now until NewAccount and Onboarding have their own flow
        style={{
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
        }}
      >
        <PictoTitleSubtitle.Picto picto="tray" />
        <PictoTitleSubtitle.Title>{title}</PictoTitleSubtitle.Title>
        <PictoTitleSubtitle.Subtitle>{subtitle}</PictoTitleSubtitle.Subtitle>
      </PictoTitleSubtitle.Container>
      {showValueProps && <ValueProps />}
      <VStack
        style={{
          rowGap: theme.spacing.sm,
          marginTop: theme.spacing.lg,
        }}
      >
        <Button
          loading={loading}
          onPress={primaryButtonAction}
          text={translate("connectViaWallet.sign")}
        />
        <Terms />
      </VStack>
    </>
  );
});

const LoadingState = memo(function LoadingState() {
  const { theme } = useAppTheme();

  return (
    <Center style={{ paddingTop: theme.spacing["6xl"] }}>
      <ActivityIndicator />
    </Center>
  );
});
