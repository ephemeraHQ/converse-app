import api from "@utils/api";

// import { AccountsClient } from "../../features/Accounts/Accounts.client";
import { JoinGroupClient } from "../../features/GroupInvites/joinGroup/JoinGroup.client";
import { NetworkMonitorClient } from "../NetworkMonitor/NetworkMonitor";

export type Environment = {
  networkMonitorClient: NetworkMonitorClient;
  joinGroupClient: JoinGroupClient;
  // accountsClient: AccountsClient;
};

export const LiveEnvironment = (): Environment => ({
  networkMonitorClient: NetworkMonitorClient.live(),
  joinGroupClient: JoinGroupClient.live({ api }),
  // accountsClient: AccountsClient.live(),
});

export const QaEnvironment = (): Environment => ({
  networkMonitorClient: NetworkMonitorClient.satisfied(),
  joinGroupClient: JoinGroupClient.live({ api }),
  // accountsClient: AccountsClient.live(),
});

export const UnimplementedEnvironment: Environment = {
  networkMonitorClient: NetworkMonitorClient.unimplemented(),
  joinGroupClient: JoinGroupClient.unimplemented(),
  // accountsClient: AccountsClient.unimplemented(),
};

const isTest = process.env.NODE_ENV === "test";
const isLowerEnvBuild = false;

const getEnvironmentForFlavor = (): Environment => {
  let result: Environment = UnimplementedEnvironment;

  if (isLowerEnvBuild) {
    result = QaEnvironment();
  } else if (!isTest) {
    result = LiveEnvironment();
  }

  return result;
};

const EnvironmentForFlavor: Environment = getEnvironmentForFlavor();

/**
 * The current environment instance.
 * This is the main export that should be used throughout the application to
 * access dependencies.
 *
 * @example
 * import { Controlled } from './Environment';
 *
 * function observeNetworkState() {
 *   Controlled.networkMonitorClient.subscribe(state => {
 *     console.log('Network state:', state.status);
 *   });
 * }
 */
export const Controlled: Environment = EnvironmentForFlavor;
