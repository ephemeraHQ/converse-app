export type Environment = {
  // Remove the joinGroupClient: JoinGroupClient;
}

export const LiveEnvironment = (): Environment => ({
  // Remove the joinGroupClient: JoinGroupClient.live({ api }),
})

export const QaEnvironment = (): Environment => ({
  // Remove the joinGroupClient: JoinGroupClient.live({ api }),
})

export const UnimplementedEnvironment: Environment = {
  // Remove the joinGroupClient: JoinGroupClient.unimplemented(),
}

const isTest = process.env.NODE_ENV === "test"
const isLowerEnvBuild = false

const getEnvironmentForFlavor = (): Environment => {
  let result: Environment = UnimplementedEnvironment

  if (isLowerEnvBuild) {
    result = QaEnvironment()
  } else if (!isTest) {
    result = LiveEnvironment()
  }

  return result
}

const EnvironmentForFlavor: Environment = getEnvironmentForFlavor()

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
export const Controlled: Environment = EnvironmentForFlavor
