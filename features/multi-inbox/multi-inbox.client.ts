import { QueryClient } from "@tanstack/react-query";
import { ConnectedEthereumWallet, usePrivy } from "@privy-io/expo";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";

import { getDbDirectory } from "@/data/db";
import { getDbEncryptionKey } from "@/utils/keychain/helpers";
import logger from "@/utils/logger";
import {
  Client as XmtpClient,
  Signer as XmtpSigner,
} from "@xmtp/react-native-sdk";
import { base } from "thirdweb/chains";
import { config } from "@/config";
type PrivyUser = NonNullable<ReturnType<typeof usePrivy>["user"]>;
type PrivySmartWalletClient = NonNullable<
  ReturnType<typeof useSmartWallets>["client"]
>;
const swc: PrivySmartWalletClient = null as unknown as PrivySmartWalletClient;

/**
 * Client for managing multiple XMTP inboxes and their lifecycle.
 *
 * Responsibilities:
 * - Managing parallel initialization of multiple inbox clients
 * - Restoring inbox states from cold starts/persisted storage
 * - Coordinating client creation/teardown during account changes
 * - Handling error states and retry logic
 * - Providing observability into client creation lifecycle
 *
 * Key Features:
 * - Abstracted XMTP implementation details
 * - Cold start restoration from encrypted storage
 * - Atomic client state management
 * - Event observers for client lifecycle changes
 * - Error handling and recovery patterns
 */
export class MultiInboxClient {
  // Core methods
  initialize: (params: {
    privyUser: PrivyUser;
    privySmartWalletClient: PrivySmartWalletClient;
    wallet: ConnectedEthereumWallet;
  }) => Promise<void>;
  addInbox: (params: { ethereumAddress: string }) => Promise<void>;
  restoreAllInboxes: () => Promise<void>;
  getInboxClientForAddress: (ethereumAddress: string) => XmtpClient;
  // Observers
  addInboxCreatedObserver: (callback: InboxCreatedCallback) => () => void;
  addClientCreationErrorObserver: (
    callback: ClientCreationErrorCallback
  ) => () => void;
  logout: () => Promise<void>;

  constructor(mutiInboxClientArgs: {
    initialize: (params: {
      privyUser: PrivyUser;
      privySmartWalletClient: PrivySmartWalletClient;
      wallet: ConnectedEthereumWallet;
    }) => Promise<void>;
    addInbox: (params: { ethereumAddress: string }) => Promise<void>;
    restoreAllInboxes: () => Promise<void>;
    getInboxClientForAddress: (ethereumAddress: string) => XmtpClient;
    addInboxCreatedObserver: (callback: InboxCreatedCallback) => () => void;
    addClientCreationErrorObserver: (
      callback: ClientCreationErrorCallback
    ) => () => void;
    logout: () => Promise<void>;
  }) {
    this.initialize = mutiInboxClientArgs.initialize;
    this.addInbox = mutiInboxClientArgs.addInbox;
    this.restoreAllInboxes = mutiInboxClientArgs.restoreAllInboxes;
    this.getInboxClientForAddress =
      mutiInboxClientArgs.getInboxClientForAddress;
    this.addInboxCreatedObserver = mutiInboxClientArgs.addInboxCreatedObserver;
    this.addClientCreationErrorObserver =
      mutiInboxClientArgs.addClientCreationErrorObserver;
    this.logout = mutiInboxClientArgs.logout;
  }
  //   const user = usePrivy()

  //   getInboxMetadataQueryOptions = ({
  //     privyUser,
  //     queryClient,
  //   }: {
  //     privyUser: PrivyUser;
  //     queryClient: QueryClient;
  //   }) => {
  //     return {
  //       queryKey: ["inboxMetadata", privyUser.id],
  //       queryFn: async () => {
  //         const inboxMetadata = await queryClient.getQueryData([
  //           "inboxMetadata",
  //           privyUserId,
  //         ]);
  //       },
  //     };
  //   };

  static live({ queryClient }: { queryClient: QueryClient }): MultiInboxClient {
    let isInitialized = false;
    let isInitializing = false;
    const ethereumSmartWalletAddressToXmtpInboxClientMap: {
      [ethereumAddress: string]: XmtpClient;
    } = {};
    const xmtpClientInboxIdToAddressMap: { [inboxId: string]: string } = {};

    const clearAllCachedClients = () => {
      Object.keys(ethereumSmartWalletAddressToXmtpInboxClientMap).forEach(
        (ethereumAddress) => {
          delete ethereumSmartWalletAddressToXmtpInboxClientMap[
            ethereumAddress
          ];
        }
      );
      Object.keys(xmtpClientInboxIdToAddressMap).forEach((inboxId) => {
        delete xmtpClientInboxIdToAddressMap[inboxId];
      });
    };

    const assertLiveMultiInboxPreconditions = () => {
      if (!isInitialized) {
        logger.error("[MultiInboxClient] MultiInboxClient is not initialized");
        throw new Error(
          "In order to access any methods on the MultiInboxClient, you must first call the `initialize` method."
        );
      }
    };

    const createXmtpInboxClientFromConnectedEthereumWallet = async (
      // note(lustig):
      // privy needs to provide us a way to create one smart contract wallet
      // for each embedded EOA in our linked_accounts, but that hasn't happened yet.
      // so at the moment we're just going to assume one smart wallet per Privy user.
      // related conversations:
      //   https://xmtp-labs.slack.com/archives/C07NSHXK693/p1738685743921409
      //   https://xmtp-labs.slack.com/archives/C05V1AJUC4T/p1738701726727009
      wallet: ConnectedEthereumWallet
    ): Promise<XmtpClient> => {
      logger.debug("[createXmtpClient] All conditions passed, creating client");

      try {
        logger.debug(
          "[createXmtpClient] Getting database directory and encryption key"
        );
        const [dbDirectory, dbEncryptionKey] = await Promise.all([
          getDbDirectory(),
          getDbEncryptionKey(),
        ]).catch((error) => {
          logger.error(
            "[createXmtpClient] Error getting database config",
            error
          );
          throw error;
        });
        logger.debug("[createXmtpClient] Got database config successfully");

        logger.debug("[createXmtpClient] Creating XMTP signer");
        const xmtpSigner: XmtpSigner = {
          getAddress: async () => {
            try {
              return wallet.address;
            } catch (error) {
              logger.error("[createXmtpClient] Error getting address", error);
              throw error;
            }
          },
          getChainId: () => {
            try {
              return base.id;
            } catch (error) {
              logger.error("[createXmtpClient] Error getting chain ID", error);
              throw error;
            }
          },
          getBlockNumber: () => undefined,
          walletType: () => "SCW",
          signMessage: async (message: string) => {
            try {
              logger.debug("[createXmtpClient] Signing message");
              const provider = await wallet.getProvider();
              const signature = await provider.request({
                method: "personal_sign",
                params: [message, wallet.address],
              });
              logger.debug("[createXmtpClient] Message signed successfully");
              logger.debug(`[createXmtpClient] Signature: ${signature}`);
              return signature;
            } catch (error) {
              logger.error("[createXmtpClient] Error signing message", error);
              throw error;
            }
          },
        };
        logger.debug("[createXmtpClient] XMTP signer created successfully");

        const options = {
          env: config.xmtpEnv,
          enableV3: true,
          dbDirectory: dbDirectory,
          dbEncryptionKey,
        };
        logger.debug("[createXmtpClient] Client options configured", options);

        logger.debug("[createXmtpClient] Creating XMTP client");
        const client = await XmtpClient.create(xmtpSigner, options).catch(
          (error) => {
            logger.error(
              "[createXmtpClient] Error creating XMTP client",
              error
            );
            throw error;
          }
        );
        logger.debug("[createXmtpClient] XMTP client created successfully");

        logger.debug("[createXmtpClient] Client setup completed successfully");
        return client;
      } catch (error) {
        logger.error(
          "[createXmtpClient] Fatal error in client creation",
          error
        );
        throw error;
      }
    };

    const liveInitialize = async ({
      privyUser,
      privySmartWalletClient,
      wallet,
    }: {
      privyUser: PrivyUser;
      privySmartWalletClient: PrivySmartWalletClient;
      wallet: ConnectedEthereumWallet;
    }) => {
      if (isInitializing) {
        throw new Error("[MultiInboxClient] Already initializing");
      }

      isInitializing = true;

      try {
        const connectedSmartWalletAddresses = privyUser.linked_accounts
          .filter((account) => account.type === "smart_wallet")
          .map((account) => account.address);

        const xmtpInboxClients = await Promise.all(
          connectedSmartWalletAddresses.map(async (address) => {
            try {
              logger.debug(
                `[liveInitialize] Checking if client exists for address: ${address}`
              );
              const clientExistsForAddress =
                ethereumSmartWalletAddressToXmtpInboxClientMap[
                  address.toLowerCase()
                ];
              if (clientExistsForAddress) {
                logger.debug(
                  `[liveInitialize] Found existing client for address: ${address}`
                );
                return clientExistsForAddress;
              }
              logger.debug(
                `[liveInitialize] No existing client found for address: ${address}, creating new one`
              );
              const xmtpInboxClient =
                await createXmtpInboxClientFromConnectedEthereumWallet(wallet);
              // const xmtpInboxClient =
              //   await createXmtpInboxClientFromSmartWalletClient(
              //     privySmartWalletClient
              //   );
              // notify inbox created observers
              inboxCreatedObserverCallbacks.forEach((callback) => {
                callback({
                  ethereumAddress: address,
                  restoredFromStorage: false,
                  xmtpInbox: xmtpInboxClient,
                });
              });
              return xmtpInboxClient;
            } catch (error) {
              logger.error(
                "[liveInitialize] Error creating XMTP inbox client",
                error
              );
              // notify client creation error observers
              clientCreationErrorObserverCallbacks.forEach((callback) => {
                callback({
                  ethereumAddress: address,
                  error: error as Error,
                });
              });
              throw error;
            }
          })
        );

        xmtpInboxClients.forEach((xmtpClient) => {
          const clientInboxId = xmtpClient.inboxId;
          const lowercaseClientLinkedEthereumAddress =
            xmtpClient.address.toLowerCase();

          ethereumSmartWalletAddressToXmtpInboxClientMap[
            lowercaseClientLinkedEthereumAddress
          ] = xmtpClient;

          xmtpClientInboxIdToAddressMap[clientInboxId] =
            lowercaseClientLinkedEthereumAddress;
        });

        isInitialized = true;
        isInitializing = false;
      } catch (error) {
        logger.error("[liveInitialize] Error initializing", error);

        throw error;
      }
    };

    const liveAddInbox = async ({
      ethereumAddress,
    }: {
      ethereumAddress: string;
    }) => {
      assertLiveMultiInboxPreconditions();

      isInitialized = true;
    };

    const liveRestoreAllInboxes = async () => {
      assertLiveMultiInboxPreconditions();

      throw new Error(
        "[MultiInboxClient] liveRestoreAllInboxes not implemented"
      );
    };

    /**
     * @deprecated Don't use client directly - this is only here
     * so we don't have to remove our client usage from the entire
     * codebase at once, but we will be doing so gradually
     */
    const liveGetInboxClientForAddress = (ethereumAddress: string) => {
      //   assertLiveMultiInboxPreconditions();

      const xmtpInboxClient =
        ethereumSmartWalletAddressToXmtpInboxClientMap[
          ethereumAddress.toLowerCase()
        ];
      return xmtpInboxClient;
    };

    let inboxCreatedObserverCallbacks: InboxCreatedCallback[] = [];
    const liveAddInboxCreatedObserver = (callback: InboxCreatedCallback) => {
      inboxCreatedObserverCallbacks.push(callback);
      return () => {
        inboxCreatedObserverCallbacks = inboxCreatedObserverCallbacks.filter(
          (cb) => cb !== callback
        );
      };
    };

    let clientCreationErrorObserverCallbacks: ClientCreationErrorCallback[] =
      [];
    const liveAddClientCreationErrorObserver = (
      callback: ClientCreationErrorCallback
    ) => {
      clientCreationErrorObserverCallbacks.push(callback);
      return () => {
        clientCreationErrorObserverCallbacks =
          clientCreationErrorObserverCallbacks.filter((cb) => cb !== callback);
      };
    };

    const liveLogout = async () => {
      clearAllCachedClients();
      // drop all clients
      Object.keys(ethereumSmartWalletAddressToXmtpInboxClientMap).forEach(
        (ethereumAddress) => {
          const xmtpClient =
            ethereumSmartWalletAddressToXmtpInboxClientMap[ethereumAddress];
          if (xmtpClient) {
            xmtpClient.deleteLocalDatabase();
            xmtpClient.dropLocalDatabaseConnection();
          }
        }
      );
    };

    return new MultiInboxClient({
      initialize: liveInitialize,
      addInbox: liveAddInbox,
      restoreAllInboxes: liveRestoreAllInboxes,
      getInboxClientForAddress: liveGetInboxClientForAddress,
      addInboxCreatedObserver: liveAddInboxCreatedObserver,
      addClientCreationErrorObserver: liveAddClientCreationErrorObserver,
      logout: liveLogout,
    });
  }

  static unimplemented(): MultiInboxClient {
    const unimplementedError = (method: string) => () => {
      const error = `
[MultiInboxClient] ERROR: unimplemented ${method} - This dependency needs explicit 
implementation for proper test isolation and to prevent accidental production usage
`;
      console.warn(error);
      throw new Error(error);
    };

    return new MultiInboxClient({
      initialize: unimplementedError("initialize"),
      addInbox: unimplementedError("addInbox"),
      restoreAllInboxes: unimplementedError("restoreAllInboxes"),
      getInboxClientForAddress: unimplementedError("getInboxClientForAddress"),
      addInboxCreatedObserver: unimplementedError("addInboxCreatedObserver"),
      addClientCreationErrorObserver: unimplementedError(
        "addClientCreationErrorObserver"
      ),
      logout: unimplementedError("logout"),
    });
  }
}

type InboxCreatedCallback = (params: {
  // @deprecated - use xmtpInbox instead
  xmtpInbox: XmtpClient;
  ethereumAddress: string;
  restoredFromStorage: boolean;
}) => void;

type ClientCreationErrorCallback = (error: {
  ethereumAddress: string;
  error: Error;
}) => void;
