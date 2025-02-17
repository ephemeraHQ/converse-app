// helpful medium article: https://medium.com/@vibhavguria07/level-up-your-app-security-implementing-firebase-app-check-in-react-native-9c7409d56504
// dashboards: https://console.firebase.google.com/u/0/project/converse-appcheck/appcheck/products
// setup instructions: https://rnfirebase.io/app-check/usage
import { config } from "@/config";
import { captureError } from "@/utils/capture-error";
import { GenericError } from "@/utils/error";
import { firebase } from "@react-native-firebase/app-check";

const appCheck = firebase.appCheck();

export const tryGetAppCheckToken = async ({
  extraSecurity = false,
}: {
  extraSecurity?: boolean;
} = {}): Promise<string | undefined> => {
  try {
    // App Check FAQ:
    // Do we need/want to use the limited use token?

    // What endpoints are protected with app check?
    // @see https://github.com/ephemeraHQ/converse-backend/blob/main/api/middlewares.ts#L27
    const appCheckTokenResult = extraSecurity
      ? await appCheck.getLimitedUseToken()
      : await appCheck.getToken();

    return appCheckTokenResult.token;
  } catch (error) {
    captureError(
      new GenericError({
        message: "Error getting App Check token",
        cause: error,
      })
    );
    return undefined;
  }
};

export async function setupAppAttest() {
  const rnfbProvider = appCheck.newReactNativeFirebaseAppCheckProvider();

  rnfbProvider.configure({
    android: {
      provider: __DEV__ ? "debug" : "playIntegrity",
      debugToken: config.appCheckDebugToken,
    },
    apple: {
      provider: __DEV__ ? "debug" : "appAttestWithDeviceCheckFallback",
      // Will be intentionally undefined in non-dev environments
      debugToken: config.appCheckDebugToken,
    },
  });

  appCheck.initializeAppCheck({
    provider: rnfbProvider,
    isTokenAutoRefreshEnabled: true,
  });
}
