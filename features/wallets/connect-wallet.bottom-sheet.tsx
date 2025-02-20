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
import { shortAddress } from "@/utils/strings/shortAddress";
import { HStack } from "@/design-system/HStack";
import { Pressable } from "@/design-system/Pressable";
import { Avatar } from "@/components/Avatar";
import { ActivityIndicator } from "@/design-system/activity-indicator";

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
      <VStack>
        <Text>
          Select an onchain identity to use as your name on Convos. You can
          change this later.
        </Text>
        <Text>
          Remember, using an onchain name may reveal other assets held in the
          same wallet.
        </Text>
        <ScrollView>
          {socialData?.map((social) => (
            <Pressable key={`${social.name}-${social.type}`}>
              <HStack>
                <Avatar uri={social.avatar} name={social.name} />
                <VStack>
                  <Text>{social.name}</Text>
                  {/*  sometimes we want to do something with this like show lens */}
                  <Text>{social.type}</Text>
                </VStack>
              </HStack>
            </Pressable>
          ))}
        </ScrollView>
      </VStack>
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
    <VStack>
      <Text>
        You’ll be asked to allow your wallet app to share your public address
        with Convos
      </Text>
      {installedWallets.map((wallet) => {
        const isLoading = loadingWalletId === wallet.thirdwebId;
        return (
          <Pressable
            disabled={isDisabled}
            key={wallet.thirdwebId}
            onPress={() =>
              onWalletTapped(wallet.thirdwebId, {
                mobileConfig: { callbackURL: coinbaseCallbackUrl },
              })
            }
          >
            <HStack>
              <Avatar uri={wallet.iconURL} name={wallet.name} />
              <VStack>
                <Text>{wallet.name}</Text>
                <Text>{wallet.thirdwebId}</Text>
              </VStack>
              {isLoading && <ActivityIndicator />}
            </HStack>
          </Pressable>
        );
      })}
    </VStack>
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
  wallets: ISupportedWallet[] | undefined;
  currentInboxId: string | undefined;
};

type ConnectWalletBottomSheetActions =
  | { type: "ConnectAWallet" }
  | { type: "SetWalletToConnect"; walletId: WalletId }
  | { type: "WalletsLoaded"; wallets: ISupportedWallet[] }
  | { type: "CurrentInboxLoaded"; inboxId: string }
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
  logger.debug(
    `[ConnectWalletBottomSheet] Reducer called with action: ${JSON.stringify(
      action,
      null,
      2
    )}`
  );
  switch (action.type) {
    case "ConnectAWallet":
      return {
        ...state,
        connectWalletBottomSheetMode: "chooseWallet",
      };

    case "CurrentInboxLoaded":
      return {
        ...state,
        connectWalletBottomSheetMode: "chooseWallet",
        currentInboxId: action.inboxId,
      };

    case "WalletsLoaded":
      return {
        ...state,
        connectWalletBottomSheetMode: "chooseWallet",
        wallets: action.wallets,
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
  const { connect } = useConnect();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const { installedWallets, isLoading: areInstalledWalletsLoading } =
    useInstalledWallets();

  useEffect(() => {
    if (!areInstalledWalletsLoading && installedWallets) {
      dispatch({ type: "WalletsLoaded", wallets: installedWallets });
    }
  }, [areInstalledWalletsLoading, installedWallets]);

  const {
    ethereumAddress: currentSenderEthereumAddress,
    inboxId: currentSenderInboxId,
  } = useCurrentSender() ?? {};

  const waitingForClientsToLoad =
    !currentSenderEthereumAddress || !currentSenderInboxId;

  useEffect(() => {
    if (!waitingForClientsToLoad) {
      dispatch({ type: "CurrentInboxLoaded", inboxId: currentSenderInboxId });
    }
  }, [waitingForClientsToLoad, currentSenderInboxId]);

  const bottomSheetRef = useBottomSheetModalRef();
  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isVisible, bottomSheetRef]);

  const initialState: ConnectWalletBottomSheetState = {
    connectWalletBottomSheetMode: "welcome",
    thirdwebWalletIdThatIsConnecting: undefined,
    connectingWalletAccount: undefined,
    socialData: undefined,
    wallets: undefined,
    currentInboxId: undefined,
  };

  const [state, dispatch] = React.useReducer(reducer, initialState);
  const {
    thirdwebWalletIdThatIsConnecting,
    socialData,
    wallets,
    connectWalletBottomSheetMode,
    connectingWalletAccount,
  } = state;

  const isShowingWelcomeMessage = connectWalletBottomSheetMode === "welcome";
  const isShowingWalletList = connectWalletBottomSheetMode === "chooseWallet";
  const isWalletListDisabled =
    connectWalletBottomSheetMode === "waitingForWalletConnection";
  const isShowingWalletsEmptyMessage =
    connectWalletBottomSheetMode === "chooseWallet" &&
    wallets !== undefined &&
    wallets.length === 0;

  const isShowingSignToConfirm =
    connectWalletBottomSheetMode === "promptForWalletSignature" ||
    connectWalletBottomSheetMode === "waitingForWalletSignature" ||
    connectWalletBottomSheetMode === "waitingForSocialDataToLoad";

  const isShowingSocialIdentityList =
    connectWalletBottomSheetMode === "chooseSocialIdentity" &&
    socialData !== undefined;
  const isShowingNoSocialsMessage =
    connectWalletBottomSheetMode === "chooseSocialIdentity" &&
    (socialData === undefined || socialData.length === 0);

  const handleConnectWalletTapped = async (
    walletType: WalletId,
    options?: any
  ) => {
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
      // note we're likely going to have to save this in a ref due to
      // state spreading in reducer...
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

      const currentInboxClient =
        MultiInboxClient.instance.getInboxClientForAddress({
          ethereumAddress: currentSenderEthereumAddress,
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

  function getBottomSheetHeaderTitle(mode: WalletImportBottomSheetMode) {
    switch (mode) {
      case "welcome":
        return "Import an onchain identity";
      case "chooseWallet":
      case "waitingForWalletConnection":
        return "Choose an app";
      case "chooseSocialIdentity":
        return "Choose an name";
      case "waitingForSocialDataToLoad":
        return "Sign to confirm";
      case "waitingForWalletSignature":
        return "Sign to confirm";
    }
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={["50%"]}
      onDismiss={onClose}
    >
      <BottomSheetHeader
        title={getBottomSheetHeaderTitle(connectWalletBottomSheetMode)}
      />
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
          {isShowingWelcomeMessage && (
            <VStack>
              <Text>
                Use your name and pic from an onchain identity like ENS, Base or
                others.
              </Text>
              <Text>
                Remember, using an onchain name may reveal other assets held in
                the same wallet.
              </Text>
              <Button
                text="Connect a wallet"
                onPress={() => {
                  dispatch({ type: "ConnectAWallet" });
                }}
              />
              <Button
                text="Back"
                onPress={() => {
                  bottomSheetRef.current?.dismiss();
                }}
              />
            </VStack>
          )}

          {isShowingWalletList && (
            <InstalledWalletsList
              installedWallets={installedWallets ?? []}
              onWalletTapped={handleConnectWalletTapped}
              coinbaseCallbackUrl={coinbaseUrl.toString()}
              isDisabled={isWalletListDisabled}
              loadingWalletId={thirdwebWalletIdThatIsConnecting}
            />
          )}

          {isShowingSignToConfirm && (
            <VStack>
              <Text>
                By signing in your wallet app, you’re proving that you own this
                wallet.
              </Text>
              <HStack>
                <Text>{thirdwebWalletIdThatIsConnecting}</Text>

                <VStack>
                  <Text>Connected</Text>
                  <Text>
                    {shortAddress(connectingWalletAccount?.address ?? "")} -{" "}
                  </Text>
                </VStack>
              </HStack>
              <Button
                text={`Sign into ${thirdwebWalletIdThatIsConnecting}`}
                onPress={async () => {
                  dispatch({ type: "SignInToWallet" });
                  const signer: InboxSigner = {
                    getAddress: async () => connectingWalletAccount?.address!,
                    getChainId: () => base.id,
                    getBlockNumber: () => undefined,
                    walletType: () => "EOA",
                    signMessage: async (message: string) => {
                      logger.debug(
                        `[ConnectWalletBottomSheet] Signing message for address ${connectingWalletAccount?.address}`
                      );
                      const signature =
                        await connectingWalletAccount!.signMessage({
                          message,
                        });
                      return signature;
                    },
                  };
                  logger.debug(
                    `[ConnectWalletBottomSheet] Adding account to inbox client`
                  );
                  const currentInboxClient =
                    MultiInboxClient.instance.getInboxClientForAddress({
                      ethereumAddress: currentSenderEthereumAddress!,
                    });
                  await currentInboxClient.addAccount(signer);
                  alert(
                    `You've sucesfully connected ${connectingWalletAccount?.address} to your inbox. You won't see anything in the UI yet, but we're working on that now.`
                  );
                }}
              />
            </VStack>
          )}

          {isShowingSocialIdentityList && (
            <SocialIdentityList
              socialData={socialData}
              onSocialIdentityTapped={handleSocialIdentityTapped}
            />
          )}

          {isShowingNoSocialsMessage && (
            <Text>No social identities found for this address.</Text>
          )}
          {isShowingWalletsEmptyMessage && (
            <Text>
              No wallets found. Please install a wallet and try again.
            </Text>
          )}

          <Button
            text="Cancel"
            variant="secondary"
            onPress={() => {
              bottomSheetRef.current?.dismiss();
            }}
          />
        </VStack>
      </BottomSheetContentContainer>
    </BottomSheetModal>
  );
}
