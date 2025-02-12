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
import { IProfileSocials } from "@/utils/api/profiles";
import { useConnect } from "thirdweb/react";

const BottomSheetStates = {
  loadingClients: {
    type: "loadingClients" as const,
  },
  loadingWallets: {
    type: "loadingWallets" as const,
  },
  noWalletsInstalled: {
    type: "noWalletsInstalled" as const,
  },
  walletsReady: (installedWallets: ISupportedWallet[]) => ({
    type: "walletsReady" as const,
    installedWallets,
  }),
  connectingToWallet: (
    walletType: WalletId,
    installedWallets: ISupportedWallet[]
  ) => ({
    type: "connectingToWallet" as const,
    walletType,
    installedWallets,
  }),
  selectingSocialIdentity: (socialData: IProfileSocials) => ({
    type: "selectingSocialIdentity" as const,
    socialData,
  }),
  socialIdentitySelected: (username: string) => ({
    type: "socialIdentitySelected" as const,
    username,
  }),
  connectedToWalletAndNotOnXmtp: (address: string) => ({
    type: "connectedToWalletAndNotOnXmtp" as const,
    address,
  }),
  connectedToWalletAndOnXmtp: (address: string) => ({
    type: "connectedToWalletAndOnXmtp" as const,
    address,
  }),
  walletConnectedSuccessfully: (address: string) => ({
    type: "walletConnectedSuccessfully" as const,
    address,
  }),
  error: {
    type: "error" as const,
  },
} as const;

type ValueOf<T> = T[keyof T];
type ReturnTypeOrValue<T> = T extends (...args: any[]) => any
  ? ReturnType<T>
  : T;
type BottomSheetState = ReturnTypeOrValue<ValueOf<typeof BottomSheetStates>>;
type BottomSheetStateType = BottomSheetState["type"];
let foo: BottomSheetState = undefined as any as BottomSheetState;

if (foo.type === "walletsReady") {
  foo.installedWallets;
} else if (foo.type === "noWalletsInstalled") {
  foo;
} else if (foo.type === "connectingToWallet") {
  foo.walletType;
  foo.installedWallets;
} else if (foo.type === "selectingSocialIdentity") {
  foo.socialData;
} else if (foo.type === "socialIdentitySelected") {
  foo.username;
}

type InstalledWalletsListProps = {
  installedWallets: ISupportedWallet[];
  onWalletTapped: (walletId: WalletId, options?: any) => void;
  coinbaseCallbackUrl: string;
  isDisabled: boolean;
  loadingWalletId: WalletId | undefined;
};

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
  onWalletConnect: (something: string) => void;
};

const coinbaseUrl = new URL(`https://${config.websiteDomain}/coinbase`);
export function ConnectWalletBottomSheet({
  isVisible,
  onClose,
  onWalletConnect,
}: ConnectWalletBottomSheetProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const { installedWallets, isLoading: areInstalledWalletsLoading } =
    useInstalledWallets();
  const { connect } = useConnect();

  const bottomSheetRef = useBottomSheetModalRef();
  const currentSender = useAccountsStore((state) => state.currentSender);
  const isInboxClientInitiated =
    !!MultiInboxClient.instance.getInboxClientForAddress({
      ethereumAddress: currentSender!.ethereumAddress,
    })!;

  const handleConnectWalletTapped = (
    walletType: WalletId,
    // eslint-disable-next-line typescript-eslint/no-explicit-any
    options?: /** only used for coinbase wallet - will add better typing if this needs to be more dynamic */ any
  ) => {
    if (!isInboxClientInitiated) {
      throw new Error(
        `[ConnectWalletBottomSheet] Inbox client not initiated for address ${
          currentSender!.ethereumAddress
        } when attempting to connect wallet ${walletType}`
      );
    }

    setBottomSheetState(
      BottomSheetStates.connectingToWallet(walletType, installedWallets)
    );
    logger.debug(
      `[ConnectWalletBottomSheet] Handling connect wallet tapped for ${walletType}`
    );

    connect(async () => {
      const w = createWallet(walletType, options);
      const walletAccount = await w.connect({
        client: thirdwebClient,
      });

      const addressToLink = walletAccount.address;

      const currentInboxClient =
        MultiInboxClient.instance.getInboxClientForAddress({
          ethereumAddress: currentSender!.ethereumAddress,
        })!;

      const resultsMap = await currentInboxClient.canMessage([addressToLink]);
      logger.debug(
        `[ConnectWalletBottomSheet] Results map: ${JSON.stringify(
          resultsMap,
          null,
          2
        )}`
      );
      const isOnXmtp = resultsMap[addressToLink];
      setBottomSheetState(
        isOnXmtp
          ? BottomSheetStates.connectedToWalletAndOnXmtp(addressToLink)
          : BottomSheetStates.connectedToWalletAndNotOnXmtp(addressToLink)
      );

      logger.debug(
        `[ConnectWalletBottomSheet] Is on XMTP? ${isOnXmtp} for address ${addressToLink}`
      );

      if (isOnXmtp) {
        alert(
          `You are already on XMTP with address ${addressToLink}. We're going to handle this carefully according to https://xmtp-labs.slack.com/archives/C07NSHXK693/p1739215446331469?thread_ts=1739212558.484059&cid=C07NSHXK693.`
        );
      } else {
        // todo load the profile stuff for this address and see the names
        // return;
        const signer: InboxSigner = {
          getAddress: async () => addressToLink,
          getChainId: () => base.id,
          getBlockNumber: () => undefined,
          walletType: () => "EOA",
          signMessage: async (message: string) => {
            const signature = await walletAccount.signMessage({ message });
            return signature;
          },
        };

        await currentInboxClient.addAccount(signer);
        alert(
          `You've sucesfully connected ${addressToLink} to your inbox. You won't see anything in the UI yet, but we're working on that now.`
        );

        const socialData = await ensureProfileSocialsQueryData(addressToLink);
        logger.debug(
          `[ConnectWalletBottomSheet] Social data for address ${addressToLink}:`,
          JSON.stringify(socialData, null, 2)
        );

        setBottomSheetState(
          BottomSheetStates.selectingSocialIdentity(
            socialData as IProfileSocials
          )
        );

        onWalletConnect(addressToLink);
        setBottomSheetState(
          BottomSheetStates.walletConnectedSuccessfully(addressToLink)
        );
      }

      return w;
    });
  };

  const initialStatus = !isInboxClientInitiated
    ? BottomSheetStates.loadingClients
    : areInstalledWalletsLoading
    ? BottomSheetStates.loadingWallets
    : installedWallets?.length === 0
    ? BottomSheetStates.noWalletsInstalled
    : BottomSheetStates.walletsReady(installedWallets ?? []);

  const [bottomSheetState, setBottomSheetState] =
    React.useState<BottomSheetState>(initialStatus);

  const statesShowingWalletList: BottomSheetStateType[] = [
    "walletsReady",
    "connectingToWallet",
  ];
  const isShowingWalletList = statesShowingWalletList.includes(
    bottomSheetState.type
  );

  const walletThatIsLoading =
    bottomSheetState.type === "connectingToWallet"
      ? bottomSheetState.walletType
      : undefined;

  const isWalletListDisabled = walletThatIsLoading !== undefined;

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
              installedWallets={installedWallets}
              onWalletTapped={handleConnectWalletTapped}
              coinbaseCallbackUrl={coinbaseUrl.toString()}
              isDisabled={isWalletListDisabled}
              loadingWalletId={walletThatIsLoading}
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
