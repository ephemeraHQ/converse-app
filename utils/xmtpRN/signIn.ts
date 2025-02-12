import { config } from "@/config";
import { Client } from "@xmtp/react-native-sdk";

export const getInboxId = (address: string) =>
  Client.getOrCreateInboxId(address, config.xmtpEnv);
