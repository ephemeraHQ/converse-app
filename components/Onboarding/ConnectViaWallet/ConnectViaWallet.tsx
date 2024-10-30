import { Button } from "@design-system/Button/Button";
import { translate } from "@i18n";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";
import { memo, useCallback } from "react";
import { ActivityIndicator } from "react-native";

import { Center } from "../../../design-system/Center";
import { VStack } from "../../../design-system/VStack";
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
  isSCW: boolean;
  onDoneConnecting: () => void;
  onErrorConnecting: (arg: { error: Error }) => void;
};

export const ConnectViaWallet = memo(function ConnectViaWallet(
  props: IConnectViaWalletProps
) {
  const { address, isSCW, onErrorConnecting, onDoneConnecting } = props;

  const disconnect = useConnectViaWalletDisconnect();

  const handleDoneConnecting = useCallback(() => {
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
      <ConnectViaWalletStateWrapper address={address} isSCW={isSCW} />
    </ConnectViaWalletContextProvider>
  );
});

// Wrapper to init the wallet state and then provide the data to the UI
const ConnectViaWalletStateWrapper = memo(
  function ConnectViaWalletStateWrapper({
    address,
    isSCW,
  }: {
    address: string;
    isSCW: boolean;
  }) {
    const { isInitializing, alreadyV3Db, onXmtp, signer } =
      useInitConnectViaWalletState({ address, isSCW });

    if (isInitializing) {
      return <ActivityIndicator />;
    }

    if (!signer) {
      // TODO: Empty state something went wrong
      return null;
    }

    return (
      <ConnectViaWalletStoreProvider
        address={address}
        isSCW={isSCW}
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
    return (
      <Center
        style={{
          paddingTop: theme.spacing["6xl"],
        }}
      >
        <ActivityIndicator />
      </Center>
    );
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
