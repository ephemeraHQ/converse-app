import { ConnectedEthereumWallet } from "@privy-io/expo";

import logger from "@/utils/logger";
import {
  Client as XmtpClient,
  Signer as XmtpSigner,
} from "@xmtp/react-native-sdk";
import { base } from "thirdweb/chains";
import { config } from "@/config";
import { PrivySmartWalletClient } from "../embedded-wallets/embedded-wallet.types";
import { codecs } from "@/utils/xmtpRN/xmtp-client/xmtp-client";
import {
  AuthStatuses,
  useAccountsStore,
} from "@/features/multi-inbox/multi-inbox.store";
import {
  ClientWithInvalidInstallation,
  CurrentSender,
  MultiInboxClientRestorationStates,
} from "./multi-inbox-client.types";
import { setInboxIdQueryData } from "@/queries/inbox-id-query";
import { getDbEncryptionKey } from "@/utils/keychain";

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
  get isRestored() {
    return (
      useAccountsStore.getState().multiInboxClientRestorationState ===
      MultiInboxClientRestorationStates.restored
    );
  }

  get isRestoring() {
    return (
      useAccountsStore.getState().multiInboxClientRestorationState ===
      MultiInboxClientRestorationStates.restoring
    );
  }

  get isError() {
    const state = useAccountsStore.getState().multiInboxClientRestorationState;
    if (typeof state === "string") {
      return false;
    }
    return !!state.error;
  }

  get isIdle() {
    return (
      useAccountsStore.getState().multiInboxClientRestorationState ===
      MultiInboxClientRestorationStates.idle
    );
  }

  private ethereumSmartWalletAddressToXmtpInboxClientMap: {
    [ethereumAddress: string]: XmtpClient;
  } = {};

  private get xmtpClientInboxIdToAddressMap() {
    return useAccountsStore.getState().senders.reduce((acc, sender) => {
      acc[sender.inboxId] = sender.ethereumAddress;
      return acc;
    }, {} as { [inboxId: string]: string });
  }

  private static _instance: MultiInboxClient;

  public static get instance(): MultiInboxClient {
    if (!this._instance) {
      this._instance = new MultiInboxClient();
    }
    return this._instance;
  }

  get currentSender(): CurrentSender | undefined {
    return useAccountsStore.getState().currentSender;
  }

  get allEthereumAccountAddresses() {
    return useAccountsStore
      .getState()
      .senders.map((sender) => sender.ethereumAddress);
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
      const dbEncryptionKey = await getDbEncryptionKey().catch((error) => {
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
        useAccountsStore
          .getState()
          .setMultiInboxClientRestorationState(
            MultiInboxClientRestorationStates.error(
              "[addInbox] No smart wallet client found, skipping inbox creation"
            )
          );
        return;
      }

      if (!privySmartWalletClient.account.address) {
        logger.debug(
          "[addInbox] Smart wallet address not available, skipping inbox creation"
        );
        useAccountsStore
          .getState()
          .setMultiInboxClientRestorationState(
            MultiInboxClientRestorationStates.error(
              "[addInbox] Smart wallet address not available, skipping inbox creation"
            )
          );
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

        if (!useAccountsStore.getState().currentSender) {
          useAccountsStore.getState().setCurrentSender({
            ethereumAddress: smartWalletEthereumAddress,
            inboxId: xmtpInboxClient.inboxId,
          });
        }

        const clientInboxId = xmtpInboxClient.inboxId;
        setInboxIdQueryData({
          account: smartWalletEthereumAddress,
          inboxId: clientInboxId,
        });

        useAccountsStore.getState().addSender({
          ethereumAddress: smartWalletEthereumAddress,
          inboxId: clientInboxId,
        });

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
        useAccountsStore
          .getState()
          .setMultiInboxClientRestorationState(
            MultiInboxClientRestorationStates.error(
              `[addInbox] Error creating XMTP inbox for address ${smartWalletEthereumAddress}:${error}`
            )
          );
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
    const previouslyCreatedInboxes = useAccountsStore.getState().senders;
    const storeReady = true;

    // const storeReady = true;
    // const previouslyCreatedInboxes: Array<{
    //   ethereumAddress: string;
    //   inboxId: string;
    // }> = [
    //   // { inboxId: "1", ethereumAddress: "0x123" },
    // ];

    if (!storeReady) {
      logger.debug(
        "[restorePreviouslyCreatedInboxesForDevice] Store not ready, skipping"
      );

      throw new Error(
        "Need to wait for the store to be ready before invoking restore"
      );
    }

    const authStatus = useAccountsStore.getState().authStatus;
    const wasSignedInLastSession = authStatus === AuthStatuses.signedIn;
    const wasSignedOutLastSession = authStatus === AuthStatuses.signedOut;
    const hasNoInboxesToRestore = previouslyCreatedInboxes.length === 0;
    const isInNoInboxButLoggedInErrorState =
      wasSignedInLastSession && hasNoInboxesToRestore;

    if (isInNoInboxButLoggedInErrorState) {
      throw new Error(
        "[restorePreviouslyCreatedInboxesForDevice] The user was signed in but there are no inboxes to restore. This is an invalid state."
      );
    }

    if (wasSignedOutLastSession) {
      logger.debug(
        "[restorePreviouslyCreatedInboxesForDevice] The user was signed out last session, skipping"
      );
      useAccountsStore
        .getState()
        .setMultiInboxClientRestorationState(
          MultiInboxClientRestorationStates.restored
        );
      useAccountsStore.getState().setCurrentSender(undefined);
      return;
    }

    try {
      logger.debug(
        "[restorePreviouslyCreatedInboxesForDevice] Starting restore"
      );

      const xmtpInboxClients: Array<
        XmtpClient | ClientWithInvalidInstallation
      > = await Promise.all(
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

            const xmtpInboxClient = await XmtpClient.build(
              ethereumAddress,
              {
                env: config.xmtpEnv,
                codecs,
                dbEncryptionKey,
              },
              inboxId
            );

            const isInstallationValid = await this.isClientInstallationValid(
              xmtpInboxClient
            );

            if (!isInstallationValid) {
              logger.warn(
                `[restorePreviouslyCreatedInboxesForDevice] Installation is invalid for address ${ethereumAddress}`
              );
              alert(
                `Installation is invalid for address ${ethereumAddress} - whats the UX treatment? Currently just not activating the Inbox.`
              );
              return undefined;
            }

            const clientInboxId = xmtpInboxClient.inboxId;
            setInboxIdQueryData({
              account: ethereumAddress,
              inboxId: clientInboxId,
            });

            useAccountsStore.getState().addSender({
              ethereumAddress,
              inboxId: clientInboxId,
            });
            return xmtpInboxClient;
          } catch (error) {
            logger.error(
              `[restorePreviouslyCreatedInboxesForDevice] Error building XMTP inbox client for address ${ethereumAddress}:`,
              error
            );
            useAccountsStore
              .getState()
              .setMultiInboxClientRestorationState(
                MultiInboxClientRestorationStates.error(
                  `[restorePreviouslyCreatedInboxesForDevice] Error building XMTP inbox client for address ${ethereumAddress}:${error}`
                )
              );
            throw error;
          }
        })
      );

      const validInstallationXmtpInboxClients = xmtpInboxClients.filter(
        (xmtpClient) => xmtpClient !== undefined
      );

      validInstallationXmtpInboxClients.forEach((xmtpClient) => {
        const clientInboxId = xmtpClient.inboxId;
        const lowercaseClientLinkedEthereumAddress =
          xmtpClient.address.toLowerCase();

        this.ethereumSmartWalletAddressToXmtpInboxClientMap[
          lowercaseClientLinkedEthereumAddress
        ] = xmtpClient;

        this.xmtpClientInboxIdToAddressMap[clientInboxId] =
          lowercaseClientLinkedEthereumAddress;
      });

      useAccountsStore
        .getState()
        .setMultiInboxClientRestorationState(
          MultiInboxClientRestorationStates.restored
        );
      logger.debug(
        "[restorePreviouslyCreatedInboxesForDevice] Successfully restored XMTP clients"
      );
    } catch (error) {
      logger.error(
        "[restorePreviouslyCreatedInboxesForDevice] Error restoring XMTP clients: THROWING",
        error
      );
      // Reset initialization state on error
      useAccountsStore
        .getState()
        .setMultiInboxClientRestorationState(
          MultiInboxClientRestorationStates.error(
            `[restorePreviouslyCreatedInboxesForDevice] Error restoring XMTP clients:${error}`
          )
        );
      this.clearAllCachedClients();
      throw error;
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

  async logoutMessagingClients(
    {
      shouldDestroyLocalData,
    }: {
      shouldDestroyLocalData: boolean;
    } = {
      shouldDestroyLocalData: false,
    }
  ) {
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
    useAccountsStore.getState().logoutAllSenders();
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
      const dbEncryptionKey = await getDbEncryptionKey().catch((error) => {
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

  private async isClientInstallationValid(client: XmtpClient) {
    const inboxState = await client.inboxState(true);
    const installationsIds = inboxState.installations.map((i) => i.id);
    logger.debug(
      `Current installation id : ${client.installationId} - All installation ids : ${installationsIds}`
    );
    if (!installationsIds.includes(client.installationId)) {
      logger.warn(`Installation ${client.installationId} has been revoked`);
      return false;
    } else {
      logger.debug(`Installation ${client.installationId} is not revoked`);
      return true;
    }
  }
}
