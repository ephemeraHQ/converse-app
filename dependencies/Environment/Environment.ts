import { NetworkMonitorClient } from "../NetworkMonitor/NetworkMonitor";

export type Environment = {
  networkMonitorClient: NetworkMonitorClient;
};

export const LiveEnvironment = (): Environment => ({
  networkMonitorClient: NetworkMonitorClient.live(),
});

export const QaEnvironment = (): Environment => ({
  networkMonitorClient: NetworkMonitorClient.satisfied(),
});

export const UnimplementedEnvironment: Environment = {
  networkMonitorClient: NetworkMonitorClient.unimplemented(),
};

const isTest = process.env.NODE_ENV === "test";
const isLowerEnvBuild = false;

const getEnvironmentForFlavor = (): Environment => {
  let result: Environment = UnimplementedEnvironment;
  console.log({ isLowerEnvBuild });
  console.log({ isTest });

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
