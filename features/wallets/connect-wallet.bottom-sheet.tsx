import React from "react";
import { BottomSheetModal } from "@/design-system/BottomSheet/BottomSheetModal";
import { BottomSheetHeader } from "@/design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetContentContainer } from "@/design-system/BottomSheet/BottomSheetContentContainer";
import { VStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { useBottomSheetModalRef } from "@/design-system/BottomSheet/BottomSheet.utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createWallet, WalletId } from "thirdweb/wallets";
import { thirdwebClient } from "@/utils/thirdweb";
import { config } from "@/config";
import { useAccountsStore } from "../multi-inbox/multi-inbox.store";
import { MultiInboxClient } from "../multi-inbox/multi-inbox.client";
import { logger } from "@/utils/logger";
import { Text } from "@/design-system/Text";
import { ensureProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import {
  ISupportedWallet,
  useInstalledWallets,
} from "./use-installed-wallets.hook";
import { Button } from "@/design-system/Button/Button";
import { InboxSigner } from "../multi-inbox/multi-inbox-client.types";
import { base } from "thirdweb/chains";
import { hasNoProfiles, IProfileSocials } from "@/utils/api/profiles";
import { useConnect } from "thirdweb/react";

type InstalledWalletsListProps = {
  installedWallets: ISupportedWallet[];
  onWalletTapped: (walletId: WalletId, options?: any) => void;
  coinbaseCallbackUrl: string;
  isDisabled: boolean;
  loadingWalletId: WalletId | undefined;
};

type SocialIdentityListProps = {
  socialData: IProfileSocials;
  onSocialIdentityTapped: (socialIdentity: string) => void;
};

function SocialIdentityList({
  socialData,
  onSocialIdentityTapped,
}: SocialIdentityListProps) {
  return (
    <>
      {socialData?.map((social) => (
        <Button
          key={social.id}
          text={social.name}
          onPress={() => onSocialIdentityTapped(social.id)}
        />
      ))}
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
      {installedWallets.map((wallet) => {
        const isLoading = loadingWalletId === wallet.thirdwebId;
        return (
          <Button
            loading={isLoading}
            disabled={isDisabled}
            key={wallet.thirdwebId}
            text={`Add ${wallet.name} to inbox (${
              isLoading ? "loading..." : ""
            })`}
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
  onWalletImported: ({
    address,
    username,
    avatarUri,
  }: {
    address: string;
    username: string | undefined;
    avatarUri: string | undefined;
  }) => void;
};

const coinbaseUrl = new URL(`https://${config.websiteDomain}/coinbase`);

type ListShowing = "wallets" | "socials";

type ConnectWalletBottomSheetState = {
  walletThatIsConnecting: WalletId | undefined;
  socialData: IProfileSocials | undefined;
  listShowing: ListShowing | undefined;
};

type ConnectWalletBottomSheetActions =
  | { type: "SetConnectingWallet"; walletId: WalletId }
  | { type: "SocialDataLoaded"; data: IProfileSocials }
  | { type: "Reset" };

function reducer(
  state: ConnectWalletBottomSheetState,
  action: ConnectWalletBottomSheetActions
): ConnectWalletBottomSheetState {
  switch (action.type) {
    case "SetConnectingWallet":
      return {
        ...state,
        walletThatIsConnecting: action.walletId,
        socialData: undefined,
      };
    case "SocialDataLoaded":
      return {
        ...state,
        socialData: action.data,
        walletThatIsConnecting: undefined,
      };
    case "Reset":
      return {
        ...state,
        walletThatIsConnecting: undefined,
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
  const currentSender = useAccountsStore((state) => state.currentSender);
  // const isInboxClientInitiated =
  //   !!MultiInboxClient.instance.getInboxClientForAddress({
  //     ethereumAddress: currentSender!.ethereumAddress,
  //   })!;

  // function getInitialShowingList(
  //   installedWallets: ISupportedWallet[],
  //   isInboxClientInitiated: boolean
  // ): ListShowing | undefined {
  //   if (!isInboxClientInitiated) {
  //     return "wallets";
  //   }

  //   if (installedWallets.length === 0) {
  //     return "socials";
  //   }

  //   return undefined;
  // }

  const initialState: ConnectWalletBottomSheetState = {
    listShowing: "wallets",
    walletThatIsConnecting: undefined,
    socialData: undefined,
  };

  const [state, dispatch] = React.useReducer(reducer, initialState);
  const { walletThatIsConnecting, socialData, listShowing } = state;

  const isShowingWalletList = listShowing === "wallets";
  const isWalletListDisabled = walletThatIsConnecting !== undefined;

  const isShowingSocialIdentityList =
    listShowing === "socials" && socialData !== undefined;
  const isShowingNoSocialsMessage =
    listShowing === "socials" && socialData === undefined;

  const handleConnectWalletTapped = (walletType: WalletId, options?: any) => {
    // if (!isInboxClientInitiated) {
    //   throw new Error(
    //     `[ConnectWalletBottomSheet] Inbox client not initiated for address ${
    //       currentSender!.ethereumAddress
    //     } when attempting to connect wallet ${walletType}`
    //   );
    // }

    dispatch({ type: "SetConnectingWallet", walletId: walletType });

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
          ethereumAddress: currentSender!.ethereumAddress,
        })!;

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
        logger.debug(
          `[ConnectWalletBottomSheet] Creating signer for address ${addressToLink}`
        );
        const signer: InboxSigner = {
          getAddress: async () => addressToLink,
          getChainId: () => base.id,
          getBlockNumber: () => undefined,
          walletType: () => "EOA",
          signMessage: async (message: string) => {
            logger.debug(
              `[ConnectWalletBottomSheet] Signing message for address ${addressToLink}`
            );
            const signature = await walletAccount.signMessage({ message });
            return signature;
          },
        };

        logger.debug(
          `[ConnectWalletBottomSheet] Adding account to inbox client`
        );
        await currentInboxClient.addAccount(signer);
        alert(
          `You've sucesfully connected ${addressToLink} to your inbox. You won't see anything in the UI yet, but we're working on that now.`
        );

        logger.debug(
          `[ConnectWalletBottomSheet] Getting social data for address ${addressToLink}`
        );
        const socialData = await ensureProfileSocialsQueryData(addressToLink);
        if (hasNoProfiles(socialData as IProfileSocials)) {
          logger.debug(
            `[ConnectWalletBottomSheet] No social profiles found for address ${addressToLink}`
          );
          onWalletImported({
            address: addressToLink,
            username: undefined,
            avatarUri: undefined,
          });
        } else {
          logger.debug(
            `[ConnectWalletBottomSheet] Social data for address ${addressToLink}:`,
            JSON.stringify(socialData, null, 2)
          );

          dispatch({
            type: "SocialDataLoaded",
            data: socialData as IProfileSocials,
          });
        }

        // onWalletImported({
        //   address: addressToLink,
        //   username: socialData.ensNames?.[0]?.name,
        //   avatarUri: socialData.ensNames?.[0]?.avatar,
        // });
      }

      return w;
    });
  };

  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isVisible, bottomSheetRef]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={["50%"]}
      onDismiss={onClose}
    >
      <BottomSheetHeader title="Import an identity" />
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
              loadingWalletId={walletThatIsConnecting}
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
