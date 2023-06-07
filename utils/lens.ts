import axios from "axios";

import config from "../config";
import { LensHandle } from "../data/db/entities/profile";

const LENS_CONVERSATION_ID_REGEX = /^lens\.dev\/dm\/(.*?)-(.*)$/;

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
