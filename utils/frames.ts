import { OpenFramesProxy } from "@open-frames/proxy-client";
import { GetMetadataResponse, OpenFrameButton } from "@open-frames/proxy-types";
import {
  FramesApiResponse,
  FramesClient,
  OPEN_FRAMES_PROXY_URL,
} from "@xmtp/frames-client";

import { MessageToDisplay } from "../components/Chat/Message/Message";
import { ConverseMessageMetadata } from "../data/db/entities/messageEntity";
import { saveMessageMetadata } from "../data/helpers/messages";
import { useFramesStore } from "../data/store/framesStore";
import { URL_REGEX } from "./regex";
import { strByteSize } from "./str";
import { isContentType } from "./xmtpRN/contentTypes";
import { getXmtpClient } from "./xmtpRN/sync";

export type FrameWithType = FramesApiResponse & {
  type: "FARCASTER_FRAME" | "XMTP_FRAME" | "PREVIEW";
};

export type FrameToDisplay = FrameWithType & {
  frameImage: string | undefined;
  isInitialFrame: boolean;
  uniqueId: string;
};

export type FramesForMessage = {
  messageId: string;
  frames: FrameWithType[];
};

export const validateFrame = (
  frame: GetMetadataResponse
): FrameWithType | undefined => {
  // Handle frames
  if (
    frame.frameInfo?.acceptedClients["xmtp"] ||
    frame.frameInfo?.acceptedClients["farcaster"]
  ) {
    const frameImageContent = frame.frameInfo?.image?.content;
    if (frameImageContent) {
      return {
        ...frame,
        type: frame.frameInfo?.acceptedClients["xmtp"]
          ? "XMTP_FRAME"
          : "FARCASTER_FRAME",
      };
    }
  }

  // Handle regular previews
  if (frame.extractedTags["og:title"] || frame.extractedTags["og:image"]) {
    return {
      ...frame,
      type: "PREVIEW",
    };
  }

  return undefined;
};

export const fetchFramesForMessage = async (
  account: string,
  message: MessageToDisplay
): Promise<FramesForMessage> => {
  // OG Preview / Frames are only for text content type
  if (isContentType("text", message.contentType)) {
    const urls = message.content.match(URL_REGEX);
    const fetchedFrames: FrameWithType[] = [];
    if (urls) {
      console.log(
        `[FramesMetadata] Found ${urls.length} URLs in message, fetching tags`
      );
      const uniqueUrls = Array.from(new Set(urls));
      const framesClient = await getFramesClient(account);
      const urlsMetadata = await Promise.all(
        uniqueUrls.map((u) =>
          framesClient.proxy
            .readMetadata(u)
            .catch((e) => console.log(`[FramesMetadata] ${e}`))
        )
      );

      const framesToSave: { [url: string]: FrameWithType } = {};

      urlsMetadata.forEach((response) => {
        if (response && Object.keys(response.extractedTags).length > 0) {
          const validatedFrame = validateFrame(response);
          if (validatedFrame) {
            fetchedFrames.push(validatedFrame);
            framesToSave[response.url] = validatedFrame;
          }
        }
      });

      // Save frames urls list on message
      const messageMetadataToSave: ConverseMessageMetadata = {
        frames: fetchedFrames.map((f) => f.url),
      };
      saveMessageMetadata(account, message, messageMetadataToSave);

      // Save frame itself to store
      useFramesStore.getState().setFrames(framesToSave);

      return { messageId: message.id, frames: fetchedFrames };
    }
  }
  return { messageId: message.id, frames: [] };
};

export type FrameButtonType = OpenFrameButton & {
  index: number;
};

export const getFrameButtons = (frame: FrameWithType) => {
  if (frame.type !== "XMTP_FRAME" && frame.type !== "FARCASTER_FRAME")
    return [];
  const frameButtons = frame.frameInfo?.buttons;
  if (!frameButtons) return [];
  const buttons: FrameButtonType[] = [];

  const button1 = frameButtons["1"];

  if (button1) {
    buttons.push({ ...button1, index: 1 });
    const button2 = frameButtons["2"];
    if (button2) {
      buttons.push({ ...button2, index: 2 });
      const button3 = frameButtons["3"];
      if (button3) {
        buttons.push({ ...button3, index: 3 });
        const button4 = frameButtons["4"];
        if (button4) {
          buttons.push({ ...button4, index: 4 });
        }
      }
    }
  }
  return buttons;
};

const frameClientByAccount: { [account: string]: FramesClient } = {};
const creatingFramesClientForAccount: { [account: string]: boolean } = {};
export const framesProxy = new OpenFramesProxy(OPEN_FRAMES_PROXY_URL, 262144); // Max 256kb meta tag

export const getFramesClient = async (account: string) => {
  while (creatingFramesClientForAccount[account]) {
    await new Promise((r) => setTimeout(r, 200));
  }
  if (frameClientByAccount[account]) return frameClientByAccount[account];
  try {
    creatingFramesClientForAccount[account] = true;
    const client = await getXmtpClient(account);
    frameClientByAccount[account] = new FramesClient(
      client,
      framesProxy as any
    );
    delete creatingFramesClientForAccount[account];
    return frameClientByAccount[account];
  } catch (e) {
    delete creatingFramesClientForAccount[account];
    throw e;
  }
};

export const getFrameImage = (frame: FrameWithType) => {
  if (frame.type === "PREVIEW") {
    if (!frame.extractedTags["og:image"]) return undefined;
    if (strByteSize(frame.extractedTags["og:image"]) <= 262144) {
      return frame.extractedTags["og:image"];
    }
  } else {
    return frame.frameInfo?.image?.content;
  }
};
