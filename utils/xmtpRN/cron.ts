import { getExistingDataSource } from "../../data/db/datasource";
import { getAccountsList, getChatStore } from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { createPendingConversations } from "./conversations";
import { sendPendingMessages } from "./send";

let lastCronTimestamp = 0;
let runningCron = false;

const xmtpCron = async () => {
  if (!useAppStore.getState().splashScreenHidden) {
    return;
  }
  runningCron = true;
  const accounts = getAccountsList();
  for (const account of accounts) {
    if (
      getChatStore(account).getState().localClientConnected &&
      getChatStore(account).getState().initialLoadDone &&
      getExistingDataSource(account)
    ) {
      try {
        await createPendingConversations(account);
        await sendPendingMessages(account);
      } catch (e) {
        console.log(e);
      }
    }
  }
  lastCronTimestamp = new Date().getTime();
  runningCron = false;
};

// Make sure the cron does not spend more
// than 1 second without running

setInterval(() => {
  if (runningCron) return;
  const now = new Date().getTime();
  if (now - lastCronTimestamp > 1000) {
    xmtpCron();
  }
}, 300);
