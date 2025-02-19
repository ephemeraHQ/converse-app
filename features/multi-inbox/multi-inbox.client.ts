import { logger } from "@/utils/logger";
import {
  RemoteAttachmentCodec,
  ReplyCodec,
  GroupUpdatedCodec,
  TextCodec,
  ReadReceiptCodec,
  ReactionCodec,
  StaticAttachmentCodec,
  Client as XmtpClient,
} from "@xmtp/react-native-sdk";
import { TransactionReferenceCodec } from "@xmtp/content-type-transaction-reference";
import { CoinbaseMessagingPaymentCodec } from "@/utils/xmtpRN/xmtp-content-types/xmtp-coinbase-payment";

import { config } from "@/config";
import {
  AuthStatuses,
  useAccountsStore,
} from "@/features/multi-inbox/multi-inbox.store";
import {
  ClientWithInvalidInstallation,
  CurrentSender,
  InboxClient,
  InboxSigner,
  MultiInboxClientRestorationStates,
} from "./multi-inbox-client.types";
import { getDbEncryptionKey } from "@/utils/keychain";
import { useEffect } from "react";
import { captureError } from "@/utils/capture-error";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";

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

  async initialize() {
    if (this.isRestoring) {
      logger.debug("[initialize] Already restoring, skipping");
      return;
    }

    if (this.isRestored) {
      logger.debug("[initialize] Already restored, skipping");
      return;
    }

    const wasSignedInLastSession =
      useAccountsStore.getState().authStatus === AuthStatuses.signedIn;

    logger.debug(
      `[initialize] Was signed in last session: ${wasSignedInLastSession}`
    );

    if (wasSignedInLastSession) {
      useAccountsStore
        .getState()
        .setMultiInboxClientRestorationState(
          MultiInboxClientRestorationStates.restoring
        );
      logger.debug(
        "[initialize] Restoring previously created inboxes for device"
      );
      await this.restorePreviouslyCreatedInboxesForDevice();
      logger.debug(
        "[initialize] Successfully restored previously created inboxes"
      );
    }

    logger.debug(
      "[initialize] Setting multi-inbox client restoration state to restored"
    );
    useAccountsStore
      .getState()
      .setMultiInboxClientRestorationState(
        MultiInboxClientRestorationStates.restored
      );
    logger.debug("[initialize] Initialization complete");
  }

  private constructor() {
    this.initialize();
  }

  private async performInboxCreationFromInboxSigner(
    inboxSigner: InboxSigner
  ): Promise<InboxClient> {
    try {
      logger.debug("[createXmtpClient] Getting database encryption key");
      const dbEncryptionKey = await getDbEncryptionKey().catch((error) => {
        logger.error("[createXmtpClient] Error getting database config", error);
        throw error;
      });

      logger.debug("[createXmtpClient] Got database config successfully");

      const options = {
        env: config.xmtpEnv,
        enableV3: true,
        dbEncryptionKey,
        codecs,
      };

      logger.debug("[createXmtpClient] Creating XMTP client");
      const client = await XmtpClient.create(inboxSigner, options).catch(
        (error) => {
          logger.error("[createXmtpClient] Error creating XMTP client", error);
          throw error;
        }
      );
      logger.debug("[createXmtpClient] XMTP client created successfully");

      return client;
    } catch (error) {
      logger.error("[createXmtpClient] Fatal error in client creation", error);
      throw error;
    }
  }

  private setErrorState(error: string) {
    useAccountsStore
      .getState()
      .setMultiInboxClientRestorationState(
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
      logger.debug(
        "[addInbox] Starting to add inbox with inboxSigner with address",
        await inboxSigner.getAddress()
      );

      const signerEthereumAddress = await inboxSigner.getAddress();

      try {
        logger.debug(
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
        logger.debug(
          `[addInbox] No existing inbox found for address: ${signerEthereumAddress}, creating new one`
        );

        const xmtpInboxClient = await this.performInboxCreationFromInboxSigner(
          inboxSigner
        );

        if (!useAccountsStore.getState().currentSender) {
          useAccountsStore.getState().setCurrentSender({
            ethereumAddress: signerEthereumAddress,
            inboxId: xmtpInboxClient.inboxId,
          });
        }

        const clientInboxId = xmtpInboxClient.inboxId;

        useAccountsStore.getState().addSender({
          ethereumAddress: signerEthereumAddress,
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
        return {
          inboxId: clientInboxId,
        };
      } catch (error) {
        logger.error(
          `[addInbox] Error creating XMTP inbox for address ${signerEthereumAddress}:`,
          error
        );
        useAccountsStore
          .getState()
          .setMultiInboxClientRestorationState(
            MultiInboxClientRestorationStates.error(
              `[addInbox] Error creating XMTP inbox for address ${signerEthereumAddress}:${error}`
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

  private async restorePreviouslyCreatedInboxesForDevice() {
    const startTime = Date.now();
    const previouslyCreatedInboxes = useAccountsStore.getState().senders;

    const authStatus = useAccountsStore.getState().authStatus;
    const wasSignedInLastSession = authStatus === AuthStatuses.signedIn;
    const hasNoInboxesToRestore = previouslyCreatedInboxes.length === 0;
    const isInNoInboxButLoggedInErrorState =
      wasSignedInLastSession && hasNoInboxesToRestore;

    if (isInNoInboxButLoggedInErrorState) {
      throw new Error(
        "[restorePreviouslyCreatedInboxesForDevice] The user was signed in but there are no inboxes to restore. This is an invalid state."
      );
    }

    try {
      logger.debug(
        "[restorePreviouslyCreatedInboxesForDevice] Starting restore"
      );

      const xmtpInboxClients: Array<
        XmtpClient | ClientWithInvalidInstallation
      > = await Promise.all(
        previouslyCreatedInboxes.map(async ({ ethereumAddress, inboxId }) => {
          logger.debug(
            `[restorePreviouslyCreatedInboxesForDevice] Restoring inbox for address: ${ethereumAddress}`
          );
          try {
            logger.debug(
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

              logger.debug(
                `[restorePreviouslyCreatedInboxesForDevice] Found existing client for address: ${ethereumAddress} during restore. This shouldnt happen...`
              );
              return clientExistsForAddress;
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
        if (!xmtpClient) {
          logger.error("[MultiInboxClient] XMTP client is undefined");
          return;
        }
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

      const duration = Date.now() - startTime;
      logger.debug(
        `[restorePreviouslyCreatedInboxesForDevice] Successfully restored XMTP clients (took ${duration}ms)`
      );

      if (duration > 1000) {
        captureError(
          new Error(
            `[restorePreviouslyCreatedInboxesForDevice] Restoring XMTP clients took more than 1 second (${duration}ms)`
          )
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(
        `[restorePreviouslyCreatedInboxesForDevice] Error restoring XMTP clients after ${duration}ms: THROWING`,
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
  getInboxClientForAddress({
    ethereumAddress,
  }: {
    ethereumAddress: string;
  }): ConverseXmtpClientType {
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

export const useInitializeMultiInboxClient = () => {
  const restored =
    useAccountsStore.getState().multiInboxClientRestorationState ===
    MultiInboxClientRestorationStates.restored;
  async function initialize() {
    await MultiInboxClient.instance.initialize();
  }
  useEffect(() => {
    if (!restored) {
      initialize();
    }
  }, [restored]);
};

export const codecs = [
  new TextCodec(),
  new ReactionCodec(),
  new ReadReceiptCodec(),
  new GroupUpdatedCodec(),
  new ReplyCodec(),
  new RemoteAttachmentCodec(),
  new StaticAttachmentCodec(),
  new TransactionReferenceCodec(),
  new CoinbaseMessagingPaymentCodec(),
];
