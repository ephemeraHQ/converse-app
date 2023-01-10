import config from "../config";
import { Client } from "../vendor/xmtp-js/index";

const env = config.xmtpEnv === "production" ? "production" : "dev";

let xmtpClient: Client;

export const isOnXmtp = async (address: string) =>
  Client.canMessage(address, {
    env,
  });
