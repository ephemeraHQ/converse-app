import { deleteLibXmtpDatabaseForInboxId } from "@utils/fileSystem";
import logger from "@utils/logger";
import { dropXmtpClient, xmtpClientByInboxId } from "@utils/xmtpRN/client";
import { useCallback } from "react";

import {
  useInboxIdsList,
  getWalletStore,
  TEMPORARY_ACCOUNT_NAME,
  useAccountsStore,
} from "../../data/store/accountsStore";
import { setAuthStatus } from "../../data/store/authStore";
import { deleteSecureItemAsync } from "../keychain";
import {
  removeInboxIdEncryptionKeyFromStorage,
  deleteXmtpKey,
} from "../keychain/helpers";
import mmkv, { clearSecureMmkvForInboxId, secureMmkvByInboxId } from "../mmkv";

import { deleteXmtpClient } from "../xmtpRN/sync";
import { unsubscribeFromNotifications } from "@features/notifications/utils/unsubscribeFromNotifications";
import { deleteSubscribedTopics } from "@features/notifications/utils/deleteSubscribedTopics";
import { InstallationId } from "@xmtp/react-native-sdk/build/lib/Client";
import { getXmtpApiHeaders } from "@utils/api";

type InboxIdToLogoutTaskMap = {
  [inboxId: string]: {
    topics: string[];
    apiHeaders: { [key: string]: string } | undefined;
    pkPath: string | undefined;
  };
};

export const getLogoutTasks = (): InboxIdToLogoutTaskMap => {
  const logoutTasksString = mmkv.getString("converse-logout-tasks");
  if (logoutTasksString) {
    try {
      return JSON.parse(logoutTasksString) as InboxIdToLogoutTaskMap;
    } catch (e) {
      logger.warn(e);
      return {};
    }
  } else {
    return {};
  }
};

export const removeLogoutTask = ({ inboxId }: { inboxId: string }) => {
  const logoutTasks = getLogoutTasks();
  if (inboxId in logoutTasks) {
    delete logoutTasks[inboxId];
    mmkv.set("converse-logout-tasks", JSON.stringify(logoutTasks));
    logger.debug(`[Logout] Removed ${inboxId} from logout tasks`);
  }
};

export const saveLogoutTask = (
  { inboxId }: { inboxId: string },
  apiHeaders: { [key: string]: string } | undefined,
  topics: string[],
  pkPath: string | undefined
) => {
  const logoutTasks = getLogoutTasks();
  logoutTasks[inboxId] = { topics, apiHeaders, pkPath };
  mmkv.set("converse-logout-tasks", JSON.stringify(logoutTasks));
  logger.debug(
    `[Logout] Saved ${topics.length} topics to logout for InboxId ${inboxId}`
  );
};

export const waitForLogoutTasksDone = async (ms: number) => {
  while (executingLogoutTasks) {
    logger.debug(`[Logout] Executing logout tasks, waiting for a bit`);
    await new Promise((r) => setTimeout(r, ms));
  }
};

let executingLogoutTasks = false;
export const CONVERSE_ALREADY_INBOX_LOGGED_IN =
  "CONVERSE_ALREADY_INBOX_LOGGED_IN";

const assertInboxNotLoggedIn = ({ inboxId }: { inboxId: string }) => {
  const linkedInboxIds = useInboxIdsList();
  if (linkedInboxIds.includes(inboxId)) {
    throw new Error(CONVERSE_ALREADY_INBOX_LOGGED_IN);
  }
  return linkedInboxIds.includes(inboxId);
};

export const executeLogoutTasks = async () => {
  // Prevent multiple logout tasks to execute at the same time
  await waitForLogoutTasksDone(3000);

  const tasks = getLogoutTasks();
  const hasTasks = Object.keys(tasks).length > 0;

  if (!hasTasks) {
    return false;
  }

  executingLogoutTasks = true;

  for (const inboxId in tasks) {
    try {
      assertInboxNotLoggedIn({ inboxId });
      const task = tasks[inboxId];
      logger.debug(
        `[Logout] Executing logout task for ${inboxId} (${task.topics.length} topics)`
      );
      await deleteXmtpKey({ inboxId });
      await removeInboxIdEncryptionKeyFromStorage({ inboxId });
      if (task.pkPath) {
        await deleteSecureItemAsync(task.pkPath);
      }
      assertInboxNotLoggedIn({ inboxId });
      if (task.apiHeaders) {
        // This seems wrong, if the request fails then the user is still subscribed to pushes
        // We should probably check if the request failed and then retry
        // Pick this up with account refactoring
        unsubscribeFromNotifications(task.apiHeaders);
        await clearSecureMmkvForInboxId({ inboxId });
      }
      removeLogoutTask({ inboxId });
    } catch (e: any) {
      if (e.toString().includes(CONVERSE_ALREADY_INBOX_LOGGED_IN)) {
        removeLogoutTask({ inboxId });
      } else {
        logger.error(e, {
          context: `[Logout] Could not finish logging out for ${inboxId}`,
        });
      }
    }
  }
  executingLogoutTasks = false;
  return true;
};

export const logoutAccount = async (
  { inboxId }: { inboxId: string },
  dropLocalDatabase: boolean,
  isV3Enabled: boolean = true
) => {
  logger.debug(
    `[Logout] Logging out from ${inboxId} with dropLocalDatabase=${dropLocalDatabase} and isV3Enabled=${isV3Enabled}`
  );
  if (isV3Enabled) {
    // This clears the libxmtp sqlite database (v3 / groups)
    try {
      // if we're attemptinmg to logout, we should be safe to assume
      // we have a client cached...
      // const client = (await getOrBuildXmtpClient(
      //   account
      // )) as ConverseXmtpClientType;
      const client = xmtpClientByInboxId[inboxId];
      await client.dropLocalDatabaseConnection();
      logger.debug("[Logout] successfully dropped connection to libxmp db");
      if (dropLocalDatabase) {
        await client.deleteLocalDatabase();
        logger.debug("[Logout] successfully deleted libxmp db");
        // Manual delete database files
        await deleteLibXmtpDatabaseForInboxId(client.inboxId);
      }
    } catch (error) {
      logger.warn("Could not get XMTP Client while logging out", {
        error,
      });
    }
  }
  await dropXmtpClient(inboxId as InstallationId);
  const inboxIds = useInboxIdsList();

  const pkPath = getWalletStore({ inboxId }).getState().privateKeyPath;

  let apiHeaders: { [key: string]: string } | undefined;

  try {
    apiHeaders = await getXmtpApiHeaders({ inboxId });
  } catch (error) {
    // If we have a broken client we might not be able
    // to generate the headers
    logger.warn("Could not get API headers while logging out", {
      error,
    });
  }

  // Remove account so we don't use it anymore
  useAccountsStore.getState().removeInboxById({ inboxId });

  // Set the new current account if we have one
  // New current account doesn't change if it's not the one to remove,
  // else we find the first non temporary one and fallback to temporary (= logout)
  const currentInboxId = useAccountsStore.getState().currentInboxId;
  const setCurrentInboxId = useAccountsStore.getState().setCurrentInboxId;
  if (currentInboxId === inboxId) {
    const nonTemporaryInboxId = inboxIds.find(
      (a) => a !== TEMPORARY_ACCOUNT_NAME && a !== inboxId
    );
    if (nonTemporaryInboxId) {
      setCurrentInboxId({ inboxId: nonTemporaryInboxId, createIfNew: false });
    } else {
      setCurrentInboxId({
        inboxId: TEMPORARY_ACCOUNT_NAME,
        createIfNew: false,
      });
      // No more accounts, let's go back to onboarding
      setAuthStatus("signedOut");
    }
  }

  deleteXmtpClient(inboxId);
  deleteSubscribedTopics(inboxId);
  delete secureMmkvByInboxId[inboxId];

  // TODO: Set topics to delete
  saveLogoutTask({ inboxId }, apiHeaders, [], pkPath);

  setTimeout(() => {
    executeLogoutTasks();
  }, 500);
};

export const useLogoutFromConverse = ({ inboxId }: { inboxId: string }) => {
  const logout = useCallback(
    async (dropLocalDatabase: boolean, isV3Enabled: boolean = true) => {
      logoutAccount({ inboxId }, dropLocalDatabase, isV3Enabled);
    },
    [inboxId]
  );
  return logout;
};
