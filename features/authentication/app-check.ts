// helpful medium article: https://medium.com/@vibhavguria07/level-up-your-app-security-implementing-firebase-app-check-in-react-native-9c7409d56504
// setup instructions: https://rnfirebase.io/app-check/usage
import { firebase } from "@react-native-firebase/app-check"
import { config } from "@/config"
import { captureError } from "@/utils/capture-error"
import { AuthenticationError } from "@/utils/error"
import { logger } from "../../utils/logger"

const appCheck = firebase.appCheck()

export const tryGetAppCheckToken = async ({
  extraSecurity = false,
}: {
  extraSecurity?: boolean
} = {}): Promise<string | undefined> => {
  try {
    const appCheckTokenResult = extraSecurity
      ? await appCheck.getLimitedUseToken()
      : await appCheck.getToken()

    return appCheckTokenResult.token
  } catch (error) {
    captureError(
      new AuthenticationError({
        error,
        additionalMessage: "error getting App Check token",
      }),
    )
    return undefined
  }
}

export async function setupAppAttest() {
  logger.debug("[setupAppAttest] Starting app attestation setup")

  const rnfbProvider = appCheck.newReactNativeFirebaseAppCheckProvider()
  logger.debug("[setupAppAttest] Created new React Native Firebase App Check provider")

  // Configure provider based on environment and platform
  rnfbProvider.configure({
    android: {
      provider: __DEV__ ? ("debug" as const) : ("playIntegrity" as const),
      debugToken: config.firebase.appCheckDebugToken,
    },
    apple: {
      provider: __DEV__ ? ("debug" as const) : ("appAttestWithDeviceCheckFallback" as const),
      debugToken: config.firebase.appCheckDebugToken, // Undefined in non-dev environments
    },
  })
  logger.debug(
    `[setupAppAttest] Configured provider for ${__DEV__ ? "debug" : "production"} environment`,
  )

  appCheck.initializeAppCheck({
    provider: rnfbProvider,
    isTokenAutoRefreshEnabled: true,
  })
  logger.debug("[setupAppAttest] Initialized App Check with auto token refresh enabled")
}
