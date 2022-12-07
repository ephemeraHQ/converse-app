import Constants from "expo-constants";

const ENV = {
  dev: {
    xmtpEnv: "dev",
  },
  prod: {
    xmtpEnv: "production",
  },
};

const getConfig = (env = Constants.manifest?.releaseChannel) => {
  if (__DEV__) {
    return ENV.dev;
  } else {
    return ENV.prod;
  }
};

export default getConfig();
