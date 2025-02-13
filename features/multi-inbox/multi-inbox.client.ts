import { config } from "@/config";
import {
  getCurrentSender,
  useAccountStore,
} from "@/features/authentication/account.store";
import { useMultiInboxClientStore } from "@/features/multi-inbox/multi-inbox.store";
import { multiInboxLogger } from "@/utils/logger";
import { getDbEncryptionKey } from "@/utils/xmtp-db-encryption-key";
import { codecs } from "@/utils/xmtpRN/xmtp-client/xmtp-client";
import { InboxId, Client as XmtpClient } from "@xmtp/react-native-sdk";
import {
  ClientWithInvalidInstallation,
  InboxClient,
  InboxSigner,
  MultiInboxClientRestorationStates,
} from "./multi-inbox-client.types";

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
      useMultiInboxClientStore.getState().multiInboxClientRestorationState ===
      MultiInboxClientRestorationStates.restored
    );
  }

  get isRestoring() {
    return (
      useMultiInboxClientStore.getState().multiInboxClientRestorationState ===
      MultiInboxClientRestorationStates.restoring
    );
  }

  get isError() {
    const state =
      useMultiInboxClientStore.getState().multiInboxClientRestorationState;
    if (typeof state === "string") {
      return false;
    }
    return !!state.error;
  }

  private ethereumSmartWalletAddressToXmtpInboxClientMap: {
    [ethereumAddress: string]: XmtpClient;
  } = {};

  private xmtpClientInboxIdToEthereumAddressMap: {
    [inboxId: string]: string;
  } = {};

  private static _instance: MultiInboxClient;

  public static get instance(): MultiInboxClient {
    if (!this._instance) {
      this._instance = new MultiInboxClient();
    }
    return this._instance;
  }

  private constructor() {}

  private async performInboxCreationFromInboxSigner(
    inboxSigner: InboxSigner
  ): Promise<InboxClient> {
    try {
      multiInboxLogger.debug(
        "[createXmtpClient] Getting database encryption key"
      );
      const dbEncryptionKey = await getDbEncryptionKey().catch((error) => {
        multiInboxLogger.error(
          "[createXmtpClient] Error getting database config",
          error
        );
        throw error;
      });

      multiInboxLogger.debug(
        "[createXmtpClient] Got database config successfully"
      );

      const options = {
        env: config.xmtpEnv,
        enableV3: true,
        dbEncryptionKey,
        codecs,
      };

      multiInboxLogger.debug("[createXmtpClient] Creating XMTP client");
      const client = await XmtpClient.create(inboxSigner, options).catch(
        (error) => {
          multiInboxLogger.error(
            "[createXmtpClient] Error creating XMTP client",
            error
          );
          throw error;
        }
      );
      multiInboxLogger.debug(
        "[createXmtpClient] XMTP client created successfully"
      );

      return client;
    } catch (error) {
      multiInboxLogger.error(
        "[createXmtpClient] Fatal error in client creation",
        error
      );
      throw error;
    }
  }

  private setErrorState(error: string) {
    useMultiInboxClientStore
      .getState()
      .actions.setMultiInboxClientRestorationState(
        MultiInboxClientRestorationStates.error(error)
      );
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
    inboxSigner,
  }: {
    inboxSigner: InboxSigner;
  }): Promise<Pick<InboxClient, "inboxId">> {
    if (!inboxSigner) {
      this.setErrorState(
        "[createNewInboxForPrivySmartContractWallet] No inbox signer provided"
      );
      throw new Error(
        "[createNewInboxForPrivySmartContractWallet] No inbox signer provided"
      );
    }

    try {
      multiInboxLogger.debug(
        "[addInbox] Starting to add inbox with inboxSigner with address",
        await inboxSigner.getAddress()
      );

      const signerEthereumAddress = await inboxSigner.getAddress();

      try {
        multiInboxLogger.debug(
          `[addInbox] Checking if inbox exists for address: ${signerEthereumAddress}`
        );

        const clientExistsForAddress =
          this.ethereumSmartWalletAddressToXmtpInboxClientMap[
            signerEthereumAddress.toLowerCase()
          ];

        if (clientExistsForAddress) {
          throw new Error(
            `[addInbox] Found existing inbox for address: ${signerEthereumAddress}`
          );
        }
        multiInboxLogger.debug(
          `[addInbox] No existing inbox found for address: ${signerEthereumAddress}, creating new one`
        );

        const xmtpInboxClient = await this.performInboxCreationFromInboxSigner(
          inboxSigner
        );

        const currentSender = getCurrentSender();
        if (!currentSender) {
          useAccountStore.getState().actions.setCurrentSender({
            ethereumAddress: signerEthereumAddress,
            inboxId: xmtpInboxClient.inboxId,
          });
        }

        const lowercaseClientLinkedEthereumAddress =
          xmtpInboxClient.address.toLowerCase();

        this.ethereumSmartWalletAddressToXmtpInboxClientMap[
          lowercaseClientLinkedEthereumAddress
        ] = xmtpInboxClient;

        this.xmtpClientInboxIdToEthereumAddressMap[xmtpInboxClient.inboxId] =
          lowercaseClientLinkedEthereumAddress;

        multiInboxLogger.debug(
          "[addInbox] Successfully created new XMTP inbox"
        );

        return {
          inboxId: xmtpInboxClient.inboxId,
        };
      } catch (error) {
        multiInboxLogger.error(
          `[addInbox] Error creating XMTP inbox for address ${signerEthereumAddress}:`,
          error
        );
        useMultiInboxClientStore
          .getState()
          .setMultiInboxClientRestorationState(
            MultiInboxClientRestorationStates.error(
              `[addInbox] Error creating XMTP inbox for address ${signerEthereumAddress}:${error}`
            )
          );
        throw error;
      }
    } catch (error) {
      multiInboxLogger.error("[addInbox] Error adding XMTP inbox:", error);
      throw error;
    } finally {
      multiInboxLogger.debug("[addInbox] Add inbox operation completed");
    }
  }

  async restorePreviouslyCreatedInboxesForDevice(args: {
    inboxes: { inboxId: InboxId; ethereumAddress: string }[];
  }) {
    const previouslyCreatedInboxes = args.inboxes;

    if (this.isRestoring) {
      multiInboxLogger.debug(
        "[restorePreviouslyCreatedInboxesForDevice] Already restoring inboxes"
      );
      return;
    }

    if (this.isRestored) {
      multiInboxLogger.debug(
        "[restorePreviouslyCreatedInboxesForDevice] Already restored inboxes"
      );
      return;
    }

    if (!previouslyCreatedInboxes.length) {
      throw new Error(
        "[restorePreviouslyCreatedInboxesForDevice] No inboxes to restore"
      );
    }

    try {
      multiInboxLogger.debug(
        "[restorePreviouslyCreatedInboxesForDevice] Starting restore"
      );

      const xmtpInboxClients: Array<
        XmtpClient | ClientWithInvalidInstallation
      > = await Promise.all(
        previouslyCreatedInboxes.map(async ({ ethereumAddress, inboxId }) => {
          multiInboxLogger.debug(
            `[restorePreviouslyCreatedInboxesForDevice] Restoring inbox for address: ${ethereumAddress}`
          );
          try {
            multiInboxLogger.debug(
              `[restorePreviouslyCreatedInboxesForDevice] Checking if client exists for address: ${ethereumAddress}`
            );
            const clientExistsForAddress =
              this.ethereumSmartWalletAddressToXmtpInboxClientMap[
                ethereumAddress.toLowerCase()
              ];
            if (clientExistsForAddress) {
              // throw new Error(
              //   `[restorePreviouslyCreatedInboxesForDevice] Found existing client for address: ${ethereumAddress} during restore. This shouldnt happen...`
              // );

              multiInboxLogger.debug(
                `[restorePreviouslyCreatedInboxesForDevice] Found existing client for address: ${ethereumAddress} during restore. This shouldnt happen...`
              );
              return clientExistsForAddress;
            }
            multiInboxLogger.debug(
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
              multiInboxLogger.warn(
                `[restorePreviouslyCreatedInboxesForDevice] Installation is invalid for address ${ethereumAddress}`
              );
              alert(
                `Installation is invalid for address ${ethereumAddress} - whats the UX treatment? Currently just not activating the Inbox.`
              );
              return undefined;
            }

            return xmtpInboxClient;
          } catch (error) {
            multiInboxLogger.error(
              `[restorePreviouslyCreatedInboxesForDevice] Error building XMTP inbox client for address ${ethereumAddress}:`,
              error
            );
            useMultiInboxClientStore
              .getState()
              .actions.setMultiInboxClientRestorationState(
                MultiInboxClientRestorationStates.error(
                  `[restorePreviouslyCreatedInboxesForDevice] Error building XMTP inbox client for address ${ethereumAddress}:${error}`
                )
              );
            throw error;
          }
        })
      );

      const validInstallationXmtpInboxClients =
        xmtpInboxClients.filter(Boolean);

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

      useMultiInboxClientStore
        .getState()
        .actions.setMultiInboxClientRestorationState(
          MultiInboxClientRestorationStates.restored
        );

      multiInboxLogger.debug(
        "[restorePreviouslyCreatedInboxesForDevice] Successfully restored XMTP clients"
      );
    } catch (error) {
      multiInboxLogger.error(
        "[restorePreviouslyCreatedInboxesForDevice] Error restoring XMTP clients: THROWING",
        error
      );

      // Reset initialization state on error
      useMultiInboxClientStore
        .getState()
        .actions.setMultiInboxClientRestorationState(
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
  }

  private async isClientInstallationValid(client: XmtpClient) {
    const inboxState = await client.inboxState(true);
    const installationsIds = inboxState.installations.map((i) => i.id);
    multiInboxLogger.debug(
      `Current installation id : ${client.installationId} - All installation ids : ${installationsIds}`
    );
    if (!installationsIds.includes(client.installationId)) {
      multiInboxLogger.warn(
        `Installation ${client.installationId} has been revoked`
      );
      return false;
    } else {
      multiInboxLogger.debug(
        `Installation ${client.installationId} is not revoked`
      );
      return true;
    }
  }
}
