import React, { useEffect } from "react";
import { BottomSheetModal } from "@/design-system/BottomSheet/BottomSheetModal";
import { BottomSheetHeader } from "@/design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetContentContainer } from "@/design-system/BottomSheet/BottomSheetContentContainer";
import { VStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { useBottomSheetModalRef } from "@/design-system/BottomSheet/BottomSheet.utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Account as ThirdwebEthereumWalletAccount,
  createWallet,
  WalletId,
} from "thirdweb/wallets";
import { config } from "@/config";
import {
  useCurrentSender,
  MultiInboxClientRestorationStates,
  useAccountsStore,
} from "../multi-inbox/multi-inbox.store";
import { MultiInboxClient } from "../multi-inbox/multi-inbox.client";
import { logger } from "@/utils/logger";
import { Text } from "@/design-system/Text";
import {
  ISupportedWallet,
  useInstalledWallets,
} from "@/features/wallets/use-installed-wallets.hook";
import { Button } from "@/design-system/Button/Button";
import { useConnect } from "thirdweb/react";
import { ensureSocialProfilesQueryData } from "@/features/social-profiles/social-lookup.query";
import {
  fetchSocialProfilesForAddress,
  IWeb3SocialProfile,
} from "../social-profiles/social-lookup.api";
import { ScrollView } from "react-native";
import { thirdwebClient } from "@/utils/thirdweb";
import { InboxSigner } from "../multi-inbox/multi-inbox-client.types";
import { base } from "thirdweb/chains";

type InstalledWalletsListProps = {
  installedWallets: ISupportedWallet[];
  onWalletTapped: (walletId: WalletId, options?: any) => void;
  coinbaseCallbackUrl: string;
  isDisabled: boolean;
  loadingWalletId: WalletId | undefined;
};

type SocialIdentityListProps = {
  socialData: IWeb3SocialProfile[];
  onSocialIdentityTapped: (socialIdentity: IWeb3SocialProfile) => void;
};

function SocialIdentityList({
  socialData,
  onSocialIdentityTapped,
}: SocialIdentityListProps) {
  return (
    <>
      <ScrollView>
        {socialData?.map((social) => (
          <Button
            key={`${social.name}-${social.type}`}
            text={JSON.stringify(social, null, 2)}
            onPress={() => onSocialIdentityTapped(social)}
          />
        ))}
      </ScrollView>
    </>
  );
}

function InstalledWalletsList({
  installedWallets,
  onWalletTapped,
  coinbaseCallbackUrl,
  isDisabled,
  loadingWalletId,
}: InstalledWalletsListProps) {
  return (
    <>
      <Text>Installed Wallets</Text>
      {installedWallets.map((wallet) => {
        const isLoading = loadingWalletId === wallet.thirdwebId;
        return (
          <Button
            loading={isLoading}
            disabled={isDisabled}
            key={wallet.thirdwebId}
            // text={`Add ${wallet.name} to inbox (${
            //   isLoading ? "loading..." : ""
            // })`}
            onPress={() =>
              onWalletTapped(wallet.thirdwebId, {
                mobileConfig: { callbackURL: coinbaseCallbackUrl },
              })
            }
          />
        );
      })}
    </>
  );
}

type ConnectWalletBottomSheetProps = {
  isVisible: boolean;
  onClose: () => void;
  onWalletImported: (socialData: IWeb3SocialProfile[]) => void;
};

const coinbaseUrl = new URL(`https://${config.websiteDomain}/coinbase`);

const WalletImportBottomSheetMode = {
  welcome: "welcome",
  waitingForWalletsToLoad: "waitingForWalletsToLoad",
  chooseWallet: "chooseWallet",
  waitingForWalletConnection: "waitingForWalletConnection",
  promptForWalletSignature: "promptForWalletSignature",
  waitingForWalletSignature: "waitingForWalletSignature",
  waitingForSocialDataToLoad: "waitingForSocialDataToLoad",
  chooseSocialIdentity: "chooseSocialIdentity",
} as const;

type WalletImportBottomSheetMode =
  (typeof WalletImportBottomSheetMode)[keyof typeof WalletImportBottomSheetMode];

type ConnectWalletBottomSheetState = {
  connectWalletBottomSheetMode: WalletImportBottomSheetMode;
  thirdwebWalletIdThatIsConnecting: WalletId | undefined;
  connectingWalletAccount: ThirdwebEthereumWalletAccount | undefined;
  socialData: IWeb3SocialProfile[] | undefined;
};

type ConnectWalletBottomSheetActions =
  | { type: "ConnectAWallet" }
  | { type: "SetWalletToConnect"; walletId: WalletId }
  | {
      type: "WalletAccountConnected";
      account: ThirdwebEthereumWalletAccount;
    }
  | { type: "SignInToWallet" }
  | { type: "WalletAccountLinkSigned" }
  | { type: "SocialDataLoaded"; data: IWeb3SocialProfile[] }
  | { type: "Reset" };

function reducer(
  state: ConnectWalletBottomSheetState,
  action: ConnectWalletBottomSheetActions
): ConnectWalletBottomSheetState {
  switch (action.type) {
    case "ConnectAWallet":
      return {
        ...state,
        connectWalletBottomSheetMode: "chooseWallet",
      };
    case "SetWalletToConnect":
      return {
        ...state,
        connectWalletBottomSheetMode: "waitingForWalletConnection",
        thirdwebWalletIdThatIsConnecting: action.walletId,
        connectingWalletAccount: undefined,
        socialData: undefined,
      };

    case "WalletAccountConnected":
      return {
        ...state,
        connectWalletBottomSheetMode: "promptForWalletSignature",
        connectingWalletAccount: action.account,
      };
    case "SignInToWallet":
      return {
        ...state,
        connectWalletBottomSheetMode: "waitingForWalletSignature",
      };

    case "WalletAccountLinkSigned":
      const hasLoadedSocialData = state.socialData !== undefined;
      const destinationMode = hasLoadedSocialData
        ? "chooseSocialIdentity"
        : "waitingForSocialDataToLoad";
      return {
        ...state,
        connectWalletBottomSheetMode: destinationMode,
      };

    case "SocialDataLoaded":
      const currentMode = state.connectWalletBottomSheetMode;
      if (currentMode === "waitingForSocialDataToLoad") {
        return {
          ...state,
          connectWalletBottomSheetMode: "chooseSocialIdentity",
          socialData: action.data,
        };
      }
      return {
        ...state,
        socialData: action.data,
      };

    case "Reset":
      return {
        ...state,
        thirdwebWalletIdThatIsConnecting: undefined,
        connectingWalletAccount: undefined,
        socialData: undefined,
      };
    default:
      return state;
  }
}

export function ConnectWalletBottomSheet({
  isVisible,
  onClose,
  onWalletImported,
}: ConnectWalletBottomSheetProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const { installedWallets, isLoading: areInstalledWalletsLoading } =
    useInstalledWallets();
  const { connect } = useConnect();

  const hasInstalledWallets = installedWallets && installedWallets.length > 0;

  const bottomSheetRef = useBottomSheetModalRef();
  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isVisible, bottomSheetRef]);

  const currentSender = useCurrentSender();
  const isRestored =
    useAccountsStore.getState().multiInboxClientRestorationState === "restored";

  const initialState: ConnectWalletBottomSheetState = {
    connectWalletBottomSheetMode: "welcome",
    thirdwebWalletIdThatIsConnecting: undefined,
    connectingWalletAccount: undefined,
    socialData: undefined,
  };
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const {
    thirdwebWalletIdThatIsConnecting,
    socialData,
    connectWalletBottomSheetMode,
  } = state;

  if (!isRestored || !currentSender) {
    return null;
  }

  const isInboxClientInitiated =
    !!MultiInboxClient.instance.getInboxClientForAddress({
      ethereumAddress: currentSender!.ethereumAddress,
    })!;

  const isShowingWalletList = connectWalletBottomSheetMode === "wallets";
  const isWalletListDisabled = thirdwebWalletIdThatIsConnecting !== undefined;

  const isShowingSocialIdentityList =
    connectWalletBottomSheetMode === "socials" && socialData !== undefined;
  const isShowingNoSocialsMessage =
    connectWalletBottomSheetMode === "socials" && socialData === undefined;

  const handleConnectWalletTapped = async (
    walletType: WalletId,
    options?: any
  ) => {
    if (!isInboxClientInitiated) {
      throw new Error(
        `[ConnectWalletBottomSheet] Inbox client not initiated for address ${
          currentSender!.ethereumAddress
        } when attempting to connect wallet ${walletType}`
      );
    }

    dispatch({ type: "SetWalletToConnect", walletId: walletType });

    logger.debug(
      `[ConnectWalletBottomSheet] Handling connect wallet tapped for ${walletType}`
    );

    connect(async () => {
      logger.debug(
        `[ConnectWalletBottomSheet] Creating wallet of type ${walletType}`
      );

      const w = createWallet(walletType, options);

      logger.debug(
        `[ConnectWalletBottomSheet] Connecting wallet to thirdweb client`
      );
      const walletAccount = await w.connect({
        client: thirdwebClient,
      });

      const addressToLink = walletAccount.address;
      dispatch({
        type: "WalletAccountConnected",
        account: walletAccount,
      });

      const socialProfiles = await ensureSocialProfilesQueryData(addressToLink);
      logger.debug(
        `[ConnectWalletBottomSheet]convos ry is awesome Social profiles: ${JSON.stringify(
          socialProfiles,
          null,
          2
        )}`
      );
      dispatch({
        type: "SocialDataLoaded",
        data: socialProfiles,
      });
      logger.debug(
        `[ConnectWalletBottomSheet] Got wallet address: ${addressToLink}`
      );

      logger.debug(
        `[ConnectWalletBottomSheet] Getting inbox client for current sender: ${
          currentSender!.ethereumAddress
        }`
      );
      const currentInboxClient =
        MultiInboxClient.instance.getInboxClientForAddress({
          ethereumAddress: currentSender.ethereumAddress,
        });

      logger.debug(
        `[ConnectWalletBottomSheet] Checking if address ${addressToLink} can be messaged`
      );
      const resultsMap = await currentInboxClient.canMessage([addressToLink]);
      logger.debug(
        `[ConnectWalletBottomSheet] Results map: ${JSON.stringify(
          resultsMap,
          null,
          2
        )}`
      );
      const isOnXmtp = resultsMap[addressToLink];

      logger.debug(
        `[ConnectWalletBottomSheet] Is on XMTP? ${isOnXmtp} for address ${addressToLink}`
      );

      if (isOnXmtp) {
        logger.debug(
          `[ConnectWalletBottomSheet] Address ${addressToLink} is already on XMTP`
        );
        alert(
          `You are already on XMTP with address ${addressToLink}. We're going to handle this carefully according to https://xmtp-labs.slack.com/archives/C07NSHXK693/p1739215446331469?thread_ts=1739212558.484059&cid=C07NSHXK693.`
        );
      } else {
        // logger.debug(
        //   `[ConnectWalletBottomSheet] Creating signer for address ${addressToLink}`
        // );
        // const signer: InboxSigner = {
        //   getAddress: async () => addressToLink,
        //   getChainId: () => base.id,
        //   getBlockNumber: () => undefined,
        //   walletType: () => "EOA",
        //   signMessage: async (message: string) => {
        //     logger.debug(
        //       `[ConnectWalletBottomSheet] Signing message for address ${addressToLink}`
        //     );
        //     const signature = await walletAccount.signMessage({ message });
        //     return signature;
        //   },
        // };
        // logger.debug(
        //   `[ConnectWalletBottomSheet] Adding account to inbox client`
        // );
        // await currentInboxClient.addAccount(signer);
        // alert(
        //   `You've sucesfully connected ${addressToLink} to your inbox. You won't see anything in the UI yet, but we're working on that now.`
        // );
        // const socialData = await ensureSocialProfilesQueryData(addressToLink);
        // onWalletImported(socialData);
      }

      return w;
    });
  };

  function handleSocialIdentityTapped(socialIdentity: IWeb3SocialProfile) {
    alert(`You tapped on ${socialIdentity.name}`);
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={["50%"]}
      onDismiss={onClose}
    >
      <BottomSheetHeader title="Imiport an identity" />
      <BottomSheetContentContainer
        style={{
          flex: 1,
        }}
      >
        <VStack
          style={{
            paddingHorizontal: theme.spacing.md,
            rowGap: theme.spacing.xs,
            paddingBottom: insets.bottom,
          }}
        >
          {isShowingWalletList && (
            <InstalledWalletsList
              installedWallets={installedWallets ?? []}
              onWalletTapped={handleConnectWalletTapped}
              coinbaseCallbackUrl={coinbaseUrl.toString()}
              isDisabled={isWalletListDisabled}
              loadingWalletId={thirdwebWalletIdThatIsConnecting}
            />
          )}

          {isShowingNoSocialsMessage && (
            <Text>No social identities found for this address.</Text>
          )}

          {isShowingSocialIdentityList && (
            <SocialIdentityList
              socialData={socialData}
              onSocialIdentityTapped={handleSocialIdentityTapped}
            />
          )}

          {areInstalledWalletsLoading && <Text>Loading wallets</Text>}

          {!hasInstalledWallets && (
            <Text>
              No wallets found. Please install a wallet and try again.
            </Text>
          )}
        </VStack>
      </BottomSheetContentContainer>
    </BottomSheetModal>
  );
}
