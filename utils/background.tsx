import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";

import { executeLogoutTasks } from "./logout";
import { sentryTrackError } from "./sentry";

const BACKGROUND_FETCH_TASK = "background-fetch";

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const hadTasks = await executeLogoutTasks();
    if (hadTasks) {
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
  } catch (e) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerBackgroundFetchTask = async () => {
  const taskManagerAvailable = await TaskManager.isAvailableAsync();
  if (!taskManagerAvailable) return;
  let isDefined = TaskManager.isTaskDefined(BACKGROUND_FETCH_TASK);
  while (!isDefined) {
    await new Promise((r) => setTimeout(r, 5000));
    isDefined = TaskManager.isTaskDefined(BACKGROUND_FETCH_TASK);
  }
  const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_FETCH_TASK
  );
  if (alreadyRegistered) return;
  BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 15, // 15 minutes
    stopOnTerminate: false, // android only,
    startOnBoot: true, // android only
  }).catch(sentryTrackError);
};
