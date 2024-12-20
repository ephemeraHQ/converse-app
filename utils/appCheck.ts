// helpful medium article: https://medium.com/@vibhavguria07/level-up-your-app-security-implementing-firebase-app-check-in-react-native-9c7409d56504
// dashboards: https://console.firebase.google.com/u/0/project/converse-appcheck/appcheck/products
// setup instructions: https://rnfirebase.io/app-check/usage
import { firebase } from "@react-native-firebase/app-check";
import logger from "./logger";
import { getConfig } from "@/config";
const appCheck = firebase.appCheck();

export const tryGetAppCheckToken = async () => {
  logger.debug("Getting token");
  try {
    // App Check FAQ:
    // Do we need/want to use the limited use token?

    // What endpoints are protected with app check?
    // @see https://github.com/ephemeraHQ/converse-backend/blob/main/api/middlewares.ts#L27
    const { token } = await appCheck.getLimitedUseToken();
    // const { token } = await appCheck.getToken();
    return token;
  } catch (error) {
    logger.error("Error getting token", error);
    return undefined;
  }
};

export async function setupAppAttest() {
  const rnfbProvider = appCheck.newReactNativeFirebaseAppCheckProvider();
  rnfbProvider.configure({
    android: {
      provider: __DEV__ ? "debug" : "playIntegrity",
      debugToken: getConfig().appCheckDebugToken,
    },
    apple: {
      provider: __DEV__ ? "debug" : "appAttestWithDeviceCheckFallback",
      // Will be intentionally undefined in non-dev environments
      debugToken: getConfig().appCheckDebugToken,
    },
  });

  appCheck.initializeAppCheck({
    provider: rnfbProvider,
    isTokenAutoRefreshEnabled: true,
  });
}
