import { ConnectedEthereumWallet } from "@privy-io/expo";

import { getDbDirectory } from "@/data/db";
import { getDbEncryptionKey } from "@/utils/keychain/helpers";
import logger from "@/utils/logger";
import {
  Client as XmtpClient,
  Signer as XmtpSigner,
} from "@xmtp/react-native-sdk";
import { base } from "thirdweb/chains";
import { config } from "@/config";
import { PrivySmartWalletClient } from "../embedded-wallets/embedded-wallet.types";
import { codecs } from "@/utils/xmtpRN/xmtp-client/xmtp-client";

export type CurrentSender = {
  ethereumAddress: string;
  xmtpInboxId: string;
};

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
  private _isRestored = false;
  private _isRestoring = false;

  get isRestored() {
    return this._isRestored;
  }

  get isRestoring() {
    return this._isRestoring;
  }

  private ethereumSmartWalletAddressToXmtpInboxClientMap: {
    [ethereumAddress: string]: XmtpClient;
  } = {};
  private xmtpClientInboxIdToAddressMap: { [inboxId: string]: string } = {};

  private inboxCreatedObserverCallbacks: InboxCreatedCallback[] = [];
  private clientCreationErrorObserverCallbacks: ClientCreationErrorCallback[] =
    [];
  private currentInboxChangedObserverCallbacks: CurrentInboxChangedCallback[] =
    [];
  private xmtpInitializedObserverCallbacks: XmtpInitializedCallback[] = [];
  private currentEthereumAddress: string | undefined;

  private static _instance: MultiInboxClient;

  public static get instance(): MultiInboxClient {
    if (!this._instance) {
      this._instance = new MultiInboxClient();
    }
    return this._instance;
  }

  get currentSender(): CurrentSender | undefined {
    // logger.debug(
    //   `[getCurrentSender] Getting current sender with ethereum address: ${this.currentEthereumAddress}`
    // );
    if (!this.currentEthereumAddress) {
      logger.debug("[getCurrentSender] No current ethereum address found");
      return undefined;
    }
    const xmtpInboxId =
      this.xmtpClientInboxIdToAddressMap[this.currentEthereumAddress];
    logger.debug(`[getCurrentSender] Found xmtp inbox ID: ${xmtpInboxId}`);
    return {
      ethereumAddress: this.currentEthereumAddress,
      xmtpInboxId,
    };
  }

  get allEthereumAccountAddresses() {
    return Object.keys(this.ethereumSmartWalletAddressToXmtpInboxClientMap);
  }

  private constructor() {}

  private async performXmtpInboxCreationFromPrivySmartWalletClient(
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

  /**
   * Creates and links a new XMTP Inbox to a user's Privy Account.
   * Anytime the user logs in with another device using
   * the same Passkey to derive the Privy Account, they will
   * be able to access this XMTP Inbox.
   *
   * @param smartWalletClient Privy Smart Wallet client to use
   * as signer for XMTP Inbox Creation
   * @returns XMTP Inbox Client
   */
  async createNewInboxForPrivySmartContractWallet({
    privySmartWalletClient,
  }: {
    privySmartWalletClient: PrivySmartWalletClient | undefined;
  }) {
    try {
      logger.debug(
        "[addInbox] Starting to add inbox with privySmartWalletClient",
        privySmartWalletClient?.account.address
      );

      if (!privySmartWalletClient) {
        logger.debug(
          "[addInbox] No smart wallet client found, skipping inbox creation"
        );
        this.xmtpInitializedObserverCallbacks.forEach((callback) => callback());
        return;
      }

      if (!privySmartWalletClient.account.address) {
        logger.debug(
          "[addInbox] Smart wallet address not available, skipping inbox creation"
        );
        this.xmtpInitializedObserverCallbacks.forEach((callback) => callback());
        return;
      }

      const smartWalletEthereumAddress = privySmartWalletClient.account.address;

      try {
        logger.debug(
          `[addInbox] Checking if inbox exists for address: ${smartWalletEthereumAddress}`
        );
        const clientExistsForAddress =
          this.ethereumSmartWalletAddressToXmtpInboxClientMap[
            smartWalletEthereumAddress.toLowerCase()
          ];
        if (clientExistsForAddress) {
          logger.debug(
            `[addInbox] Found existing inbox for address: ${smartWalletEthereumAddress}`
          );
          return clientExistsForAddress;
        }
        logger.debug(
          `[addInbox] No existing inbox found for address: ${smartWalletEthereumAddress}, creating new one`
        );

        const xmtpInboxClient =
          await this.performXmtpInboxCreationFromPrivySmartWalletClient(
            privySmartWalletClient
          );

        if (!this.currentEthereumAddress) {
          this.currentEthereumAddress = smartWalletEthereumAddress;
          this.notifyCurrentInboxChanged({
            ethereumAddress: smartWalletEthereumAddress,
            xmtpInboxId: xmtpInboxClient.inboxId,
          });
        }

        // notify inbox created observers
        this.inboxCreatedObserverCallbacks.forEach((callback) => {
          callback({
            ethereumAddress: smartWalletEthereumAddress,
            restoredFromStorage: false,
            xmtpInbox: xmtpInboxClient,
          });
        });

        const clientInboxId = xmtpInboxClient.inboxId;
        const lowercaseClientLinkedEthereumAddress =
          xmtpInboxClient.address.toLowerCase();

        this.ethereumSmartWalletAddressToXmtpInboxClientMap[
          lowercaseClientLinkedEthereumAddress
        ] = xmtpInboxClient;

        this.xmtpClientInboxIdToAddressMap[clientInboxId] =
          lowercaseClientLinkedEthereumAddress;

        logger.debug("[addInbox] Successfully created new XMTP inbox");
      } catch (error) {
        logger.error(
          `[addInbox] Error creating XMTP inbox for address ${smartWalletEthereumAddress}:`,
          error
        );
        // notify client creation error observers
        this.clientCreationErrorObserverCallbacks.forEach((callback) => {
          callback({
            ethereumAddress: smartWalletEthereumAddress,
            error: error as Error,
          });
        });
        throw error;
      }
    } catch (error) {
      logger.error("[addInbox] Error adding XMTP inbox:", error);
      throw error;
    } finally {
      logger.debug("[addInbox] Add inbox operation completed");
    }
  }

  async restorePreviouslyCreatedInboxesForDevice() {
    if (this.isRestoring) {
      logger.debug(
        "[restorePreviouslyCreatedInboxesForDevice] Already restoring, skipping"
      );
      return;
    }

    if (this.isRestored) {
      logger.debug(
        "[restorePreviouslyCreatedInboxesForDevice] Already restored, skipping"
      );
      return;
    }

    // const previouslyCreatedInboxes = someStore.getState().createdInboxes
    // const previousActiveSender = someStore.getState().activeSender
    // const storeReady = someStore.getState().isReady

    const storeReady = true;
    const previouslyCreatedInboxes: Array<{
      ethereumAddress: string;
      inboxId: string;
    }> = [
      // { inboxId: "1", ethereumAddress: "0x123" },
    ];

    if (!storeReady) {
      logger.debug(
        "[restorePreviouslyCreatedInboxesForDevice] Store not ready, skipping"
      );

      throw new Error(
        "Need to wait for the store to be ready before invoking restore"
      );
    }
    if (!previouslyCreatedInboxes || previouslyCreatedInboxes.length === 0) {
      logger.debug(
        "[restorePreviouslyCreatedInboxesForDevice] No previously created inboxes found, skipping"
      );
      this._isRestored = true;
      return;
    }

    this._isRestoring = true;

    try {
      logger.debug(
        "[restorePreviouslyCreatedInboxesForDevice] Starting restore"
      );

      const xmtpInboxClients = await Promise.all(
        previouslyCreatedInboxes.map(async ({ ethereumAddress, inboxId }) => {
          try {
            logger.debug(
              `[restorePreviouslyCreatedInboxesForDevice] Checking if client exists for address: ${ethereumAddress}`
            );
            const clientExistsForAddress =
              this.ethereumSmartWalletAddressToXmtpInboxClientMap[
                ethereumAddress.toLowerCase()
              ];
            if (clientExistsForAddress) {
              throw new Error(
                `[restorePreviouslyCreatedInboxesForDevice] Found existing client for address: ${ethereumAddress} during restore. This shouldnt happen...`
              );
            }
            logger.debug(
              `[restorePreviouslyCreatedInboxesForDevice] No existing client found for address: ${ethereumAddress}, (this is expected during restore) building XMTP client`
            );

            const dbEncryptionKey = await getDbEncryptionKey();
            const dbDirectory = await getDbDirectory();

            const xmtpInboxClient = await XmtpClient.build(
              ethereumAddress,
              {
                env: config.xmtpEnv,
                codecs,
                dbEncryptionKey,
                dbDirectory,
              },
              inboxId
            );

            // notify inbox created observers
            this.inboxCreatedObserverCallbacks.forEach((callback) => {
              callback({
                ethereumAddress,
                restoredFromStorage: true,
                xmtpInbox: xmtpInboxClient,
              });
            });
            return xmtpInboxClient;
          } catch (error) {
            logger.error(
              `[restorePreviouslyCreatedInboxesForDevice] Error building XMTP inbox client for address ${ethereumAddress}:`,
              error
            );
            // notify client creation error observers
            this.clientCreationErrorObserverCallbacks.forEach((callback) => {
              callback({
                ethereumAddress,
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

      this._isRestored = true;
      logger.debug(
        "[restorePreviouslyCreatedInboxesForDevice] Successfully restored XMTP clients"
      );
      this.xmtpInitializedObserverCallbacks.forEach((callback) => callback());
    } catch (error) {
      logger.error(
        "[restorePreviouslyCreatedInboxesForDevice] Error restoring XMTP clients: THROWING",
        error
      );
      // Reset initialization state on error
      this._isRestored = false;
      this.clearAllCachedClients();
      throw error;
    } finally {
      logger.debug(
        "[restorePreviouslyCreatedInboxesForDevice] Initialization completed"
      );
      this._isRestoring = false;
    }
  }

  /**
   * @deprecated Don't use client directly - this is only here
   * so we don't have to remove our client usage from the entire
   * codebase at once, but we will be doing so gradually
   */
  getInboxClientForAddress({ ethereumAddress }: { ethereumAddress: string }) {
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

  addXmtpInitializedObserver(callback: XmtpInitializedCallback) {
    this.xmtpInitializedObserverCallbacks.push(callback);
    return () => {
      this.xmtpInitializedObserverCallbacks =
        this.xmtpInitializedObserverCallbacks.filter((cb) => cb !== callback);
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

  addCurrentInboxChangedObserver(callback: CurrentInboxChangedCallback) {
    this.currentInboxChangedObserverCallbacks.push(callback);
    return () => {
      this.currentInboxChangedObserverCallbacks =
        this.currentInboxChangedObserverCallbacks.filter(
          (cb) => cb !== callback
        );
    };
  }

  private notifyCurrentInboxChanged(params: {
    ethereumAddress: string;
    xmtpInboxId: string;
  }) {
    this.currentInboxChangedObserverCallbacks.forEach((callback) => {
      callback(params);
    });
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
    if (!this.isRestored) {
      logger.error("[MultiInboxClient] MultiInboxClient is not initialized");
      throw new Error(
        "In order to access any methods on the MultiInboxClient, you must first call the `initialize` method."
      );
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

type CurrentInboxChangedCallback = (params: {
  ethereumAddress: string;
  xmtpInboxId: string;
}) => void;

type XmtpInitializedCallback = () => void;
