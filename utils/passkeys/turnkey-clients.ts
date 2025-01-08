import { TurnkeyClient } from "@turnkey/http";

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
