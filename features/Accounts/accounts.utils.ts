import { getCurrentInboxId } from "@/data/store/accountsStore";
import logger from "@/utils/logger";
import { xmtpClientByInboxId } from "@/utils/xmtpRN/client";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/client.types";

/**
 * Generic type that maps the ifNotFoundStrategy to the appropriate
 * return type for getXmtpClient. This makes it more ergonomic to use getXmtpClient
 * in a way that is compatible with the ifNotFoundStrategy.
 *
 * @template T - The strategy type ("throw" | "logAndReturnUndefined")
 * @returns ConverseXmtpClientType if strategy is "throw"
 * @returns ConverseXmtpClientType | undefined if strategy is
 *         "logAndReturnUndefined"
 *
 * @example
 * // With throw strategy:
 * const client: InboxReturnType<"throw">
 * // Type is ConverseXmtpClientType
 *
 * @example
 * // With logAndReturnUndefined strategy:
 * const client: InboxReturnType<"logAndReturnUndefined">
 * // Type is ConverseXmtpClientType | undefined
 */
type InboxReturnType<T extends "throw" | "logAndReturnUndefined"> =
  T extends "throw"
    ? ConverseXmtpClientType
    : ConverseXmtpClientType | undefined;

export const getXmtpClient = <
  T extends "throw" | "logAndReturnUndefined" = "logAndReturnUndefined",
>(args: {
  inboxId?: string;
  caller: string;
  ifNotFoundStrategy?: T;
}): InboxReturnType<T> => {
  const { caller, ifNotFoundStrategy = "logAndReturnUndefined" } = args;
  const inboxId = args.inboxId || getCurrentInboxId();
  let message = "";
  let error: Error | undefined;
  if (!inboxId) {
    message = `[${caller}] Inbox ID is required`;
    error = new Error(message);
  }
  const client = xmtpClientByInboxId[inboxId!];
  if (!client) {
    message = `[${caller}] Client not found`;
    error = new Error(message);
  }
  if (error) {
    if (ifNotFoundStrategy === "throw") {
      throw error;
    } else if (ifNotFoundStrategy === "logAndReturnUndefined") {
      logger.error(message);
      return undefined as InboxReturnType<T>;
    }
  }

  return client;
};

export const getXmtpClientForCurrentInboxOrThrow = ({
  caller,
}: {
  caller: string;
}) => {
  const inboxId = getCurrentInboxId();
  return getXmtpClientOrThrow({ inboxId, caller });
};

export const getXmtpClientOrThrow = ({
  inboxId,
  caller,
}: {
  inboxId?: string;
  caller: string;
}): ConverseXmtpClientType => {
  const client = getXmtpClient({
    inboxId,
    caller,
    ifNotFoundStrategy: "throw",
  });
  return client;
};

/**
 * Generic type that maps the ifNotFoundStrategy to the appropriate
 * return type for getXmtpClient. This makes it more ergonomic to use getXmtpClient
 * in a way that is compatible with the ifNotFoundStrategy.
 *
 * @template T - The strategy type ("throw" | "logAndReturnUndefined")
 * @returns ConverseXmtpClientType if strategy is "throw"
 * @returns ConverseXmtpClientType | undefined if strategy is
 *         "logAndReturnUndefined"
 *
 * @example
 * // With throw strategy:
 * const client: InboxReturnType<"throw">
 * // Type is ConverseXmtpClientType
 *
 * @example
 * // With logAndReturnUndefined strategy:
 * const client: InboxReturnType<"logAndReturnUndefined">
 * // Type is ConverseXmtpClientType | undefined
 */
type InboxReturnType<T extends "throw" | "logAndReturnUndefined"> =
  T extends "throw"
    ? ConverseXmtpClientType
    : ConverseXmtpClientType | undefined;

export const getXmtpClient = <
  T extends "throw" | "logAndReturnUndefined" = "logAndReturnUndefined",
>(args: {
  inboxId?: string;
  caller: string;
  ifNotFoundStrategy?: T;
}): InboxReturnType<T> => {
  const { caller, ifNotFoundStrategy = "logAndReturnUndefined" } = args;
  const inboxId = args.inboxId || getCurrentInboxId();
  let message = "";
  let error: Error | undefined;
  if (!inboxId) {
    message = `[${caller}] Inbox ID is required`;
    error = new Error(message);
  }
  const client = xmtpClientByInboxId[inboxId!];
  if (!client) {
    message = `[${caller}] Client not found`;
    error = new Error(message);
  }
  if (error) {
    if (ifNotFoundStrategy === "throw") {
      throw error;
    } else if (ifNotFoundStrategy === "logAndReturnUndefined") {
      logger.error(message);
      return undefined as InboxReturnType<T>;
    }
  }

  return client;
};
