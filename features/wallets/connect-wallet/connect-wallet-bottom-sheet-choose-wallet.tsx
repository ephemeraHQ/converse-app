import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { Client } from "@xmtp/react-native-sdk";
import React, { memo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConnect } from "thirdweb/react";
import { createWallet as createWalletThirdweb } from "thirdweb/wallets";
import { useDynamicPagesStoreContext } from "@/components/dynamic-pages/dynamic-pages.store-context";
import { createConfirmationAlert } from "@/components/promise-alert";
import { config } from "@/config";
import { BottomSheetHeaderBase } from "@/design-system/BottomSheet/BottomSheetHeader";
import { Image } from "@/design-system/image";
import { Loader } from "@/design-system/loader";
import { Pressable } from "@/design-system/Pressable";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import {
  useMultiInboxStore,
  useSafeCurrentSender,
} from "@/features/authentication/multi-inbox.store";
import { createXmtpSignerFromPrivySwc } from "@/features/onboarding/utils/create-xmtp-signer-from-privy-swc";
import { prefetchSocialProfilesForAddress } from "@/features/social-profiles/social-profiles.query";
import {
  ISupportedWallet,
  useInstalledWalletsQuery,
} from "@/features/wallets/installed-wallets.query";
import { getDbEncryptionKey } from "@/features/xmtp/xmtp-client/xmtp-client";
import {
  ISupportedXmtpCodecs,
  supportedXmtpCodecs,
} from "@/features/xmtp/xmtp-codecs/xmtp-codecs";
import { addWalletToInboxId } from "@/features/xmtp/xmtp-inbox-id/add-wallet-to-inbox-id";
import { useEthAddressesForXmtpInboxId } from "@/features/xmtp/xmtp-inbox-id/eth-addresses-for-xmtp-inbox-id.query";
import { getInboxIdFromEthAddress } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address";
import { getXmtpSigner } from "@/features/xmtp/xmtp-signer/get-xmtp-signer";
import { useAppTheme } from "@/theme/use-app-theme";
import { captureError, captureErrorWithToast } from "@/utils/capture-error";
import { GenericError } from "@/utils/error";
import logger from "@/utils/logger";
import { thirdwebClient } from "@/utils/thirdweb";
import { useConnectWalletStore } from "./connect-wallet.store";

export const ConnectWalletBottomSheetChooseWallet = memo(
  function ConnectWalletBottomSheetChooseWallet() {
    const { theme } = useAppTheme();
    const insets = useSafeAreaInsets();

    const actions = useDynamicPagesStoreContext((state) => state.actions);

    return (
      <>
        <BottomSheetHeaderBase title="Choose an app" />

        <VStack
          style={{
            paddingHorizontal: theme.spacing.md,
            rowGap: theme.spacing.xs,
            paddingBottom: insets.bottom,
          }}
        >
          <VStack
            style={{
              paddingBottom: theme.spacing.xs,
            }}
          >
            <Text preset="small" color="secondary">
              You’ll be asked to allow your wallet app to share your public
              address with Convos
            </Text>
          </VStack>

          <InstalledWalletsList />
        </VStack>
      </>
    );
  },
);

function InstalledWalletsList() {
  const { theme } = useAppTheme();
  const currentSender = useSafeCurrentSender();
  const { connect, error, isConnecting } = useConnect();
  console.log("isConnecting:", isConnecting);
  console.log("error:", error);

  // Get wallet connection state from the store
  const { thirdwebWalletIdThatIsConnecting, isWalletListDisabled } =
    useConnectWalletStore();

  // Get installed wallets data
  const { data: installedWallets, isLoading: areInstalledWalletsLoading } =
    useInstalledWalletsQuery();

  const { data: ethAddressesForXmtpInboxId } = useEthAddressesForXmtpInboxId({
    clientEthAddress: currentSender.ethereumAddress,
    inboxId: currentSender.inboxId,
  });

  console.log("ethAddressesForXmtpInboxId:", ethAddressesForXmtpInboxId);

  const hasInstalledWallets = Boolean(
    installedWallets && installedWallets.length > 0,
  );

  // Get state from store
  // const { setConnectingWallet, setConnectingEthereumAddress } =
  //   useConnectWalletStore();

  const { client: smartWalletClient } = useSmartWallets();

  // Handle wallet connection
  const connectWallet = async (wallet: ISupportedWallet) => {
    // setConnectingWallet(wallet.thirdwebId);

    logger.debug(
      `[ConnectWalletBottomSheet] Handling connect wallet tapped for ${wallet.thirdwebId}`,
    );

    try {
      connect(async () => {
        try {
          // Create the wallet first - this is what thirdweb expects to be returned
          const thirdwebWallet = createWalletThirdweb(wallet.thirdwebId, {
            mobileConfig: wallet.mobileConfig,
          });

          // Connect wallet to thirdweb client
          logger.debug(
            `[ConnectWalletBottomSheet] Connecting wallet to thirdweb client`,
          );

          const walletAccount = await thirdwebWallet.connect({
            client: thirdwebClient,
          });

          const addressToLink = walletAccount.address;

          // Update store with discovered address
          // setConnectingEthereumAddress(addressToLink);

          logger.debug(
            `[ConnectWalletBottomSheet] Got wallet address: ${addressToLink}`,
          );

          // Get social profiles for the address
          prefetchSocialProfilesForAddress({
            ethAddress: addressToLink,
          }).catch(captureError);

          // logger.debug(
          //   `[ConnectWalletBottomSheet] Social profiles: ${JSON.stringify(
          //     socialProfiles,
          //     null,
          //     2,
          //   )}`,
          // );

          // // Update store with social data
          // setSocialData(socialProfiles);

          // Get inbox client for current sender

          // const isOnXmtp = await inboxIdCanMessageEthAddress({
          //   inboxId: currentSender.inboxId,
          //   ethAddress: addressToLink,
          // });

          // Tmp
          await new Promise((resolve) => setTimeout(resolve, 1000));

          console.log("addressToLink:", addressToLink);
          console.log("currentSender:", currentSender);

          const inboxId = await getInboxIdFromEthAddress({
            clientEthAddress: currentSender.ethereumAddress,
            targetEthAddress: addressToLink,
          });

          console.log(`inboxId for ${addressToLink}:`, inboxId);

          console.log("currentSender:", currentSender);
          const chain = thirdwebWallet.getChain();

          if (!chain) {
            throw new Error("Chain not found");
          }

          if (inboxId) {
            const isAlreadyLinkedToCurrentSender =
              inboxId === currentSender.inboxId;

            console.log(
              "isAlreadyLinkedToCurrentSender:",
              isAlreadyLinkedToCurrentSender,
            );

            if (isAlreadyLinkedToCurrentSender) {
              logger.debug(
                `[ConnectWalletBottomSheet] Address ${addressToLink} is already linked to current sender ${currentSender.inboxId}`,
              );

              alert(`Already linked to current inbox Id`);

              return thirdwebWallet;
            }

            logger.debug(
              `[ConnectWalletBottomSheet] Address ${addressToLink} is already linked to an inbox ID ${inboxId} on XMTP`,
            );

            const hasConfirmed = await createConfirmationAlert({
              title: `Linked on XMTP with address ${addressToLink}`,
              message: `Do you want to still connect with wallet to`,
            });

            console.log("res:", hasConfirmed);

            if (hasConfirmed) {
              // useMultiInboxStore.getState().actions.setCurrentSender({
              //   ethereumAddress: addressToLink,
              //   inboxId: inboxId,
              // });

              // Create new client with new address
              const newClient = await Client.create<ISupportedXmtpCodecs>(
                getXmtpSigner({
                  ethAddress: addressToLink,
                  type: "EOA",
                  chainId: chain.id,
                  signMessage: async (message: string) => {
                    logger.debug(
                      `[ConnectWalletBottomSheet] Signing message for address ${addressToLink}`,
                    );
                    const signature = await walletAccount.signMessage({
                      message,
                    });
                    return signature;
                  },
                }),
                {
                  appVersion: `${config.appName}/${config.appVersion}`,
                  env: config.xmtpEnv,
                  dbEncryptionKey: await getDbEncryptionKey(),
                  codecs: supportedXmtpCodecs,
                },
              );
              // await createXmtpClient({
              //   inboxSigner: getXmtpSigner({
              //     ethAddress: addressToLink,
              //     type: "EOA",
              //     chainId: chain.id,
              //     signMessage: async (message: string) => {
              //       logger.debug(
              //         `[ConnectWalletBottomSheet] Signing message for address ${addressToLink}`,
              //       );
              //       const signature = await walletAccount.signMessage({
              //         message,
              //       });
              //       return signature;
              //     },
              //   }),
              // });

              logger.debug(
                `[ConnectWalletBottomSheet] New client inboxId: ${newClient.inboxId}`,
              );

              const inboxState = await newClient.inboxStates(true, [
                newClient.inboxId,
              ]);
              console.log("new client inboxState:", inboxState);

              // await addWalletToInboxId({
              //   inboxId: inboxId,
              //   wallet: createXmtpSignerFromPrivySwc(smartWalletClient!),
              // });

              console.log(
                "smartWalletClient:",
                smartWalletClient?.account.address,
              );

              // Add previously created smart wallet client to the existing inboxId
              await newClient.addAccount(
                createXmtpSignerFromPrivySwc(smartWalletClient!),
                true,
              );

              useMultiInboxStore.getState().actions.setCurrentSender({
                ethereumAddress: addressToLink,
                inboxId: inboxId,
              });

              logger.debug(
                `[ConnectWalletBottomSheet] Added wallet to new inbox ID`,
              );
            } else {
              throw new Error("User did not confirm");
              // thirdwebWallet.disconnect()
              // return thirdwebWallet
            }

            // onWalletImported(socialProfiles);
          } else {
            logger.debug(
              `[ConnectWalletBottomSheet] Address ${addressToLink} is not linked to an inbox ID, link it to this one!`,
            );

            // Create signer for the wallet
            const xmtpSigner = getXmtpSigner({
              ethAddress: addressToLink,
              type: "EOA",
              chainId: chain.id,
              signMessage: async (message: string) => {
                logger.debug(
                  `[ConnectWalletBottomSheet] Signing message for address ${addressToLink}`,
                );
                const signature = await walletAccount.signMessage({ message });
                return signature;
              },
            });

            logger.debug(
              `[ConnectWalletBottomSheet] Adding account to inbox client`,
            );

            await addWalletToInboxId({
              inboxId: currentSender.inboxId,
              wallet: xmtpSigner,
            });

            alert(
              `You've successfully connected ${addressToLink} to your inbox. You won't see anything in the UI yet, but we're working on that now.`,
            );

            // onWalletImported(socialProfiles);
          }

          return thirdwebWallet;
        } catch (error) {
          throw new GenericError({
            error,
            additionalMessage: `Failed to connect wallet: ${wallet.thirdwebId}`,
          });
        }
      });
    } catch (error) {
      captureErrorWithToast(error, {
        message: `Error connecting ${wallet.name} wallet`,
      });
    }
  };

  if (areInstalledWalletsLoading) {
    return <Text>Loading wallets</Text>;
  }

  if (!hasInstalledWallets) {
    return (
      <Text>No wallets found. Please install a wallet and try again.</Text>
    );
  }

  return (
    <VStack style={{}}>
      {installedWallets?.map((wallet: ISupportedWallet) => {
        const isConnecting =
          thirdwebWalletIdThatIsConnecting === wallet.thirdwebId;
        return (
          <Pressable
            key={wallet.thirdwebId}
            disabled={isWalletListDisabled}
            style={{
              flexDirection: "row",
              alignItems: "center",
              columnGap: theme.spacing.xs,
            }}
            onPress={() => connectWallet(wallet)}
          >
            <Image
              source={{ uri: wallet.iconURL }}
              style={{
                width: theme.spacing.xxl,
                height: theme.spacing.xxl,
                borderRadius: theme.borderRadius.xs,
              }}
            />
            <VStack
              style={{
                flex: 1,
              }}
            >
              {isConnecting && (
                <Text preset="small" color="secondary">
                  Connecting...
                </Text>
              )}
              <Text>{wallet.name}</Text>
            </VStack>
            {isConnecting && <Loader />}
          </Pressable>
          // <Button
          //   loading={thirdwebWalletIdThatIsConnecting === wallet.thirdwebId}
          //   disabled={isWalletListDisabled}
          //   key={wallet.thirdwebId}
          //   text={`Add ${wallet.name} to inbox`}
          //   onPress={() =>
          //     onWalletTapped(wallet.thirdwebId, {
          //       mobileConfig: { callbackURL: coinbaseCallbackUrl },
          //     })
          //   }
          // />
        );
      })}
    </VStack>
  );
}
