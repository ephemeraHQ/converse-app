import config from "../config";
import { currentAccount } from "../data/store/accountsStore";
import { sentryAddBreadcrumb } from "./sentry";

const timestamps: { [timestampId: string]: { start: number; last: number } } =
  {};

export const debugTimeSpent = ({
  start,
  noReset,
  actionToLog,
  id,
}: {
  start?: boolean;
  noReset?: boolean;
  actionToLog?: string;
  id?: string;
}) => {
  const now = new Date().getTime();
  const timestampId = id || "DEFAULT_TIMESTAMP";
  if (start) {
    console.log("\n");
  }
  if (!(timestampId in timestamps) || start) {
    timestamps[timestampId] = { start: now, last: now };
  }
  if (actionToLog) {
    const timeSpentSinceLast = (now - timestamps[timestampId].last) / 1000;
    const timeSpentSinceStart = (now - timestamps[timestampId].start) / 1000;
    console.log(
      `    ⌛  [${timestampId}] “${actionToLog}” took ${timeSpentSinceLast} seconds (since start: ${timeSpentSinceStart} seconds)`
    );
    // addLog(
    //   `⌛  [${timestampId}] “${actionToLog}” took ${timeSpentSinceLast} seconds (since start: ${timeSpentSinceStart} seconds)`
    // );
  }
  if (!noReset) {
    timestamps[timestampId].last = now;
    if (!actionToLog) {
      console.log(`    ⌛  [${timestampId}] timestamp reset`);
      // addLog(`⌛  [${timestampId}] timestamp reset`);
    }
  }
};

export let debugLogs: string[] = [];

export const resetDebugLogs = () => {
  debugLogs = [];
};

export const addLog = (log: string) => {
  if (config.debugMenu || config.debugAddresses.includes(currentAccount())) {
    console.log(`${new Date().toISOString()} - ${log}`);
    sentryAddBreadcrumb(log, true);
    debugLogs.push(`${new Date().toISOString()} - ${log}`);
  }
};
