// helpful medium article: https://medium.com/@vibhavguria07/level-up-your-app-security-implementing-firebase-app-check-in-react-native-9c7409d56504
import { firebase } from "@react-native-firebase/app-check";
import logger from "./logger";

// // run an async script top level
async function run() {
  logger.debug("run");
  const appCheck = await firebase.appCheck();

  const rnfbProvider = appCheck.newReactNativeFirebaseAppCheckProvider();
  rnfbProvider.configure({
    android: {
      provider: __DEV__ ? "debug" : "playIntegrity",
      debugToken:
        "some token you have configured for your project firebase web console",
    },
    apple: {
      provider: __DEV__ ? "debug" : "appAttestWithDeviceCheckFallback",
      debugToken:
        "some token you have configured for your project firebase web console",
    },
  });

  firebase.appCheck().initializeAppCheck({
    provider: rnfbProvider,
    isTokenAutoRefreshEnabled: true,
  });
  try {
    const { token } = await firebase.appCheck().getToken(true);

    if (token.length > 0) {
      console.log("AppCheck verification passed");
    }
  } catch (error) {
    console.log(`AppCheck verification failed: ${error}`);
  }
}

export const foo = () => {
  console.log("foo");
  run()
    .then((res) => {
      console.log("res", res);
    })
    .catch((err) => {
      console.log("err", err);
    });
};
