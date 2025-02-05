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
  private isInitialized = false;
  private isInitializing = false;
  private ethereumSmartWalletAddressToXmtpInboxClientMap: {
    [ethereumAddress: string]: XmtpClient;
  } = {};
  private xmtpClientInboxIdToAddressMap: { [inboxId: string]: string } = {};
  private inboxCreatedObserverCallbacks: InboxCreatedCallback[] = [];
  private clientCreationErrorObserverCallbacks: ClientCreationErrorCallback[] =
    [];

  private static instance: MultiInboxClient | null = null;

  public static getInstance() {
    if (!MultiInboxClient.instance) {
      MultiInboxClient.instance = new MultiInboxClient();
    }
    return MultiInboxClient.instance;
  }

  private constructor() {}

  private clearAllCachedClients() {
    Object.keys(this.ethereumSmartWalletAddressToXmtpInboxClientMap).forEach(
      (ethereumAddress) => {
        delete this.ethereumSmartWalletAddressToXmtpInboxClientMap[
          ethereumAddress
        ];
      }
    );
    Object.keys(this.xmtpClientInboxIdToAddressMap).forEach((inboxId) => {
      delete this.xmtpClientInboxIdToAddressMap[inboxId];
    });
  }

  private assertLiveMultiInboxPreconditions() {
    if (!this.isInitialized) {
      logger.error("[MultiInboxClient] MultiInboxClient is not initialized");
      throw new Error(
        "In order to access any methods on the MultiInboxClient, you must first call the `initialize` method."
      );
    }
  }

  private async createXmtpInboxClientFromSmartWalletClient(
    smartWalletClient: PrivySmartWalletClient
  ): Promise<XmtpClient> {
    if (!smartWalletClient?.account.address) {
      throw new Error("[createXmtpClient] Smart wallet address not available");
    }

    if (!smartWalletClient) {
      throw new Error("[createXmtpClient] Smart wallet client not available");
    }

    logger.debug("[createXmtpClient] All conditions passed, creating client");

    try {
      logger.debug(
        "[createXmtpClient] Getting database directory and encryption key"
      );
      const [dbDirectory, dbEncryptionKey] = await Promise.all([
        getDbDirectory(),
        getDbEncryptionKey(),
      ]).catch((error) => {
        logger.error("[createXmtpClient] Error getting database config", error);
        throw error;
      });
      logger.debug("[createXmtpClient] Got database config successfully");

      logger.debug("[createXmtpClient] Creating XMTP signer");
      const xmtpSigner: XmtpSigner = {
        getAddress: async () => {
          try {
            return smartWalletClient.account.address;
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
            const signature = await smartWalletClient.signMessage({
              message,
            });
            logger.debug("[createXmtpClient] Message signed successfully");
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
          logger.error("[createXmtpClient] Error creating XMTP client", error);
          throw error;
        }
      );
      logger.debug("[createXmtpClient] XMTP client created successfully");

      logger.debug("[createXmtpClient] Client setup completed successfully");
      return client;
    } catch (error) {
      logger.error("[createXmtpClient] Fatal error in client creation", error);
      throw error;
    }
  }

  private async createXmtpInboxClientFromConnectedEthereumWallet(
    wallet: ConnectedEthereumWallet
  ): Promise<XmtpClient> {
    logger.debug("[createXmtpClient] All conditions passed, creating client");

    try {
      logger.debug(
        "[createXmtpClient] Getting database directory and encryption key"
      );
      const [dbDirectory, dbEncryptionKey] = await Promise.all([
        getDbDirectory(),
        getDbEncryptionKey(),
      ]).catch((error) => {
        logger.error("[createXmtpClient] Error getting database config", error);
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
          logger.error("[createXmtpClient] Error creating XMTP client", error);
          throw error;
        }
      );
      logger.debug("[createXmtpClient] XMTP client created successfully");

      logger.debug("[createXmtpClient] Client setup completed successfully");
      return client;
    } catch (error) {
      logger.error("[createXmtpClient] Fatal error in client creation", error);
      throw error;
    }
  }

  async initialize({
    privyUser,
    privySmartWalletClient,
  }: // wallet,
  {
    privyUser: PrivyUser;
    privySmartWalletClient: PrivySmartWalletClient;
    // wallet: ConnectedEthereumWallet;
  }) {
    if (this.isInitializing) {
      throw new Error("[MultiInboxClient] Already initializing");
    }

    this.isInitializing = true;

    try {
      const connectedSmartWalletAddresses = privyUser.linked_accounts
        .filter((account) => account.type === "smart_wallet")
        .map((account) => account.address);

      const xmtpInboxClients = await Promise.all(
        connectedSmartWalletAddresses.map(async (address) => {
          try {
            logger.debug(
              `[initialize] Checking if client exists for address: ${address}`
            );
            const clientExistsForAddress =
              this.ethereumSmartWalletAddressToXmtpInboxClientMap[
                address.toLowerCase()
              ];
            if (clientExistsForAddress) {
              logger.debug(
                `[initialize] Found existing client for address: ${address}`
              );
              return clientExistsForAddress;
            }
            logger.debug(
              `[initialize] No existing client found for address: ${address}, creating new one`
            );

            const xmtpInboxClient =
              await this.createXmtpInboxClientFromSmartWalletClient(
                privySmartWalletClient
              );
            // notify inbox created observers
            this.inboxCreatedObserverCallbacks.forEach((callback) => {
              callback({
                ethereumAddress: address,
                restoredFromStorage: false,
                xmtpInbox: xmtpInboxClient,
              });
            });
            return xmtpInboxClient;
          } catch (error) {
            logger.error(
              "[initialize] Error creating XMTP inbox client",
              error
            );
            // notify client creation error observers
            this.clientCreationErrorObserverCallbacks.forEach((callback) => {
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

        this.ethereumSmartWalletAddressToXmtpInboxClientMap[
          lowercaseClientLinkedEthereumAddress
        ] = xmtpClient;

        this.xmtpClientInboxIdToAddressMap[clientInboxId] =
          lowercaseClientLinkedEthereumAddress;
      });

      this.isInitialized = true;
    } catch (error) {
      logger.error("[initialize] Error initializing", error);
      throw error;
    } finally {
      logger.debug("[initialize] Initialization completed");
      this.isInitializing = false;
    }
  }

  async addInbox({ ethereumAddress }: { ethereumAddress: string }) {
    throw new Error(
      "[MultiInboxClient] addInbox not implemented until Privy supports multiple SWC"
    );
    // this.assertLiveMultiInboxPreconditions();
  }

  async restoreAllInboxes() {
    this.assertLiveMultiInboxPreconditions();
    // todo this should be used in initialize
    throw new Error("[MultiInboxClient] restoreAllInboxes not implemented");
  }

  /**
   * @deprecated Don't use client directly - this is only here
   * so we don't have to remove our client usage from the entire
   * codebase at once, but we will be doing so gradually
   */
  getInboxClientForAddress(ethereumAddress: string) {
    return this.ethereumSmartWalletAddressToXmtpInboxClientMap[
      ethereumAddress.toLowerCase()
    ];
  }

  addInboxCreatedObserver(callback: InboxCreatedCallback) {
    this.inboxCreatedObserverCallbacks.push(callback);
    return () => {
      this.inboxCreatedObserverCallbacks =
        this.inboxCreatedObserverCallbacks.filter((cb) => cb !== callback);
    };
  }

  addClientCreationErrorObserver(callback: ClientCreationErrorCallback) {
    this.clientCreationErrorObserverCallbacks.push(callback);
    return () => {
      this.clientCreationErrorObserverCallbacks =
        this.clientCreationErrorObserverCallbacks.filter(
          (cb) => cb !== callback
        );
    };
  }

  private destroyLocalDatabases() {
    Object.keys(this.ethereumSmartWalletAddressToXmtpInboxClientMap).forEach(
      (ethereumAddress) => {
        const xmtpClient =
          this.ethereumSmartWalletAddressToXmtpInboxClientMap[ethereumAddress];
        if (xmtpClient) {
          xmtpClient.deleteLocalDatabase();
          xmtpClient.dropLocalDatabaseConnection();
        }
      }
    );
  }

  async logoutMessagingClients({
    shouldDestroyLocalData,
  }: {
    shouldDestroyLocalData: boolean;
  }) {
    if (shouldDestroyLocalData) {
      this.destroyLocalDatabases();
    }

    this.clearAllCachedClients();
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
