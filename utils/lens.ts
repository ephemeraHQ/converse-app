import axios from "axios";

import config from "../config";
import { LensHandle } from "../data/db/entities/profile";

const LENS_CONVERSATION_ID_REGEX = /^lens\.dev\/dm\/(.*?)-(.*)$/;

type ResolvedLensProfile = {
  handle: string;
  ownedBy: string;
};

const resolveLensProfile = async (
  profileId: string
): Promise<ResolvedLensProfile | null> => {
  try {
    const { data } = await axios.post(`https://${config.lensApiDomain}/`, {
      operationName: "ResolveProfile",
      query:
        "query ResolveProfile($profileId: ProfileId!) {\n  profile(request: {profileId: $profileId}) {\n    handle\n ownedBy\n  }\n}\n",
      variables: {
        profileId,
      },
    });
    return data.data?.profile
      ? {
          handle: data.data?.profile.handle,
          ownedBy: data.data?.profile.ownedBy,
        }
      : null;
  } catch (e: any) {
    console.log(`Lens profile resolution failed for lens profile ${profileId}`);
    console.log(e?.response?.data?.errors);
  }
  return null;
};

export const getLensHandleFromConversationIdAndPeer = (
  topic: string | undefined,
  peerLensHandles?: LensHandle[]
) => {
  if (!topic || !peerLensHandles) return null;
  const match = topic.match(LENS_CONVERSATION_ID_REGEX);
  if (!match) return null;
  const lensId1 = match[1];
  const lensId2 = match[2];
  const peerLensHandle = peerLensHandles.find(
    (l) => l.profileId === lensId1 || l.profileId === lensId2
  );
  return peerLensHandle?.handle;
};

export const getLensOwner = async (handle: string): Promise<string | null> => {
  try {
    const { data } = await axios.post(`https://${config.lensApiDomain}/`, {
      operationName: "Profile",
      query:
        "query Profile($handle: Handle) {\n  profile(request: {handle: $handle}) {\n    ownedBy\n  }\n}\n",
      variables: {
        handle,
      },
    });
    return data.data?.profile?.ownedBy || null;
  } catch (e: any) {
    console.log(e?.response);
  }
  return null;
};
