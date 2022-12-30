import { Client } from "@xmtp/xmtp-js";

import config from "../config";

const env = config.xmtpEnv === "production" ? "production" : "dev";

export const isOnXmtp = async (address: string) =>
  Client.canMessage(address, {
    env,
  });
