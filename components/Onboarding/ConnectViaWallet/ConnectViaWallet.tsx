import { Button } from "@design-system/Button/Button";
import { translate } from "@i18n";
import { useFocusEffect } from "@react-navigation/native";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";
import { memo, useCallback, useRef } from "react";
import { ActivityIndicator } from "react-native";

import { Center } from "../../../design-system/Center";
import { VStack } from "../../../design-system/VStack";
import { useRouter } from "../../../navigation/useNavigation";
import { spacing } from "../../../theme";
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

  const router = useRouter();

  const finishedConnecting = useRef(false);

  const disconnect = useConnectViaWalletDisconnect();

  // Before we leave, make sure the user completed the flow otherwise disconnect
  useRouter({
    onBeforeRemove: () => {
      if (!finishedConnecting.current) {
        disconnect({ address });
      }
    },
  });

  useFocusEffect(
    useCallback(() => {
      // User already connected wallet but decided to come back here, so we need to go back to get started screen
      if (finishedConnecting.current) {
        router.goBack();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const handleDoneConnecting = useCallback(() => {
    onDoneConnecting();
    finishedConnecting.current = true;
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
    const { isInitializing, alreadyV3Db, onXmtp, signer } =
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
        onXmtp={onXmtp}
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
    onXmtp,
    alreadyV3Db,
    signaturesDone,
  } = useConnectViaWalletStoreContext((state) => ({
    address: state.address,
    loading: state.loading,
    waitingForNextSignature: state.waitingForNextSignature,
    signer: state.signer,
    onXmtp: state.onXmtp,
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
  if (onXmtp && !alreadyV3Db) {
    title = `${translate("connectViaWallet.sign")} (${signaturesDone + 1}/2)`;
    subtitle = translate("connectViaWallet.firstSignature.explanation");
  }
  // On XMTP, has V3 DB signature
  else if (onXmtp && alreadyV3Db) {
    title = translate("connectViaWallet.firstSignature.title");
    subtitle = translate("connectViaWallet.secondSignature.explanation");
  }
  // Waiting for second signature
  else if (waitingForNextSignature && !loading) {
    title = translate("connectViaWallet.secondSignature.title");
    subtitle = translate("connectViaWallet.secondSignature.explanation");
    showValueProps = false;
  }
  // Not on XMTP, needs first signature
  else {
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
          rowGap: spacing.sm,
          marginTop: spacing.lg,
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
