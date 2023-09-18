import _ from "lodash";

import { addLog } from "../components/DebugButton";
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
    addLog(
      `⌛  [${timestampId}] “${actionToLog}” took ${timeSpentSinceLast} seconds (since start: ${timeSpentSinceStart} seconds)`
    );
  }
  if (!noReset) {
    timestamps[timestampId].last = now;
    if (!actionToLog) {
      console.log(`    ⌛  [${timestampId}] timestamp reset`);
      addLog(`⌛  [${timestampId}] timestamp reset`);
    }
  }
};

const renders: { [id: string]: { count: number; lastData: any } } = {};

export const debugLogRender = (id: string, dataToDiff?: any) => {
  const lastRender = renders[id] || { count: 0 };
  let diff = undefined;
  if (dataToDiff) {
    const lastDataToDiff = lastRender.lastData;
    if (lastDataToDiff) {
      diff = _.differenceWith(
        _.toPairs(dataToDiff),
        _.toPairs(lastDataToDiff),
        _.isEqual
      );
    } else {
      diff = dataToDiff;
    }
  }
  renders[id] = { count: lastRender.count + 1, lastData: dataToDiff };
  console.log(`  ⚠️   ${id} - ${renders[id].count} renders`);
  if (dataToDiff) {
    console.log({ diff });
  }
};
