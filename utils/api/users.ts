import {
  analyticsAppVersion,
  analyticsBuildNumber,
  analyticsPlatform,
} from "../analytics";
import { api } from "./api";
import { getXmtpApiHeaders } from "./auth";

const lastSaveUser: { [address: string]: number } = {};

export const saveUser = async (args: {
  address: string;
  inboxId: string;
  privyId: string;
}) => {
  const { address } = args;
  const now = new Date().getTime();
  const last = lastSaveUser[address] || 0;
  if (now - last < 3000) {
    // Avoid race condition when changing account at same
    // time than coming back on the app.
    return;
  }
  lastSaveUser[address] = now;

  await api.post(
    "/api/user",
    {
      address,
      platform: analyticsPlatform,
      version: analyticsAppVersion,
      build: analyticsBuildNumber,
    },
    { headers: await getXmtpApiHeaders(address) }
  );
};

export const getSendersSpamScores = async (sendersAddresses: string[]) => {
  if (!sendersAddresses || sendersAddresses.length === 0) return {};
  const { data } = await api.post("/api/spam/senders/batch", {
    sendersAddresses: sendersAddresses.filter((s) => !!s),
  });
  return data as { [senderAddress: string]: number };
};
