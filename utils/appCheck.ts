// helpful medium article: https://medium.com/@vibhavguria07/level-up-your-app-security-implementing-firebase-app-check-in-react-native-9c7409d56504
// dashboards: https://console.firebase.google.com/u/0/project/converse-appcheck/appcheck/products
import { firebase } from "@react-native-firebase/app-check";
import logger from "./logger";
import { getConfig } from "@/config";
const appCheck = firebase.appCheck();

export const tryGetAppCheckToken = async () => {
  logger.debug("Getting token");
  try {
    // Open Questions:
    // Do we need to use the limited use token?
    // What endpoints are we going to protect with app check?
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
      /* TODO: get key and add to env*/
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
