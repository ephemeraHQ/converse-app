import { TurnkeyClient } from "@turnkey/http";
import { PasskeyStamper } from "@turnkey/react-native-passkey-stamper";
import { RPID } from "./passkeys.constants";

export const turnkeyClientMap: Record<string, TurnkeyClient> = {};

export const getTurnkeyClient = (subOrgId: string) => {
  return turnkeyClientMap[subOrgId];
};

export const setTurnkeyClient = (
  subOrgId: string,
  turnkeyClient: TurnkeyClient
) => {
  turnkeyClientMap[subOrgId] = turnkeyClient;
};

export const getOrCreateTurnkeyClient = (subOrgId: string) => {
  let client = getTurnkeyClient(subOrgId);
  if (!!client) {
    return client;
  }

  const stamper = new PasskeyStamper({
    rpId: RPID,
  });

  client = new TurnkeyClient({ baseUrl: "https://api.turnkey.com" }, stamper);

  setTurnkeyClient(subOrgId, client);

  return client;
};
