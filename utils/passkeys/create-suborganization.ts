import { createPasskey } from "@turnkey/react-native-passkey-stamper";
import { createTurnkeySubOrganization } from "../api";

export async function createSubOrganization(
  authenticatorParams: Awaited<ReturnType<typeof createPasskey>>
) {
  const res = await createTurnkeySubOrganization(authenticatorParams);
  return res;
}
