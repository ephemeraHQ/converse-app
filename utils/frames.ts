import { FramesApiResponse, FramesClient } from "@xmtp/frames-client";
import { Client } from "@xmtp/xmtp-js";

import { MessageToDisplay } from "../components/Chat/ChatMessage";
import config from "../config";
import { ConverseMessageMetadata } from "../data/db/entities/messageEntity";
import { saveMessageMetadata } from "../data/helpers/messages";
import { useFramesStore } from "../data/store/framesStore";
import { loadXmtpKey } from "./keychain/helpers";
import { URL_REGEX } from "./regex";
import { isContentType } from "./xmtpRN/contentTypes";

export type FrameToDisplay = FramesApiResponse & {
  type: "FRAME" | "XMTP_FRAME" | "PREVIEW";
};

export type FramesForMessage = {
  messageId: string;
  frames: FrameToDisplay[];
};

export const getFrameType = (tags: FrameToDisplay["extractedTags"]) => {
  if (tags["fc:frame"] === "vNext" && tags["fc:frame:image"]) {
    if (tags["of:accepts:xmtp"]) return "XMTP_FRAME";
    return "FRAME";
  }
  if (tags["og:image"] || tags["og:title"]) {
    return "PREVIEW";
  }
  return undefined;
};

export const getMetadaTagsForMessage = async (
  account: string,
  message: MessageToDisplay
): Promise<FramesForMessage> => {
  const framesClient = await getFramesClient(account);
  // OG Preview / Frames are only for text content type
  if (isContentType("text", message.contentType)) {
    const urls = message.content.match(URL_REGEX);
    const extractedTags: FrameToDisplay[] = [];
    if (urls) {
      console.log(
        `[FramesMetadata] Found ${urls.length} URLs in message, fetching tags`
      );
      const uniqueUrls = Array.from(new Set(urls));
      const urlsMetadata = await Promise.all(
        uniqueUrls.map((u) =>
          framesClient.proxy
            .readMetadata(u)
            .catch((e) => console.log(`[FramesMetadata] ${e}`))
        )
      );

      const framesToSave: { [url: string]: FrameToDisplay } = {};

      urlsMetadata.forEach((response) => {
        if (response && Object.keys(response.extractedTags).length > 0) {
          const frameType = getFrameType(response.extractedTags);
          if (frameType) {
            const frameToDisplay: FrameToDisplay = {
              ...response,
              type: frameType,
            };
            extractedTags.push(frameToDisplay);
            framesToSave[response.url] = frameToDisplay;
          }
        }
      });

      // Save frames urls list on message
      const messageMetadataToSave: ConverseMessageMetadata = {
        frames: extractedTags.map((f) => f.url),
      };
      saveMessageMetadata(account, message, messageMetadataToSave);

      // Save frame itself to store
      useFramesStore.getState().setFrames(framesToSave);

      return { messageId: message.id, frames: extractedTags };
    }
  }
  return { messageId: message.id, frames: [] };
};

export type FrameButtonType = {
  index: number;
  title: string;
  action: FrameAction;
};

export const getFrameButtons = (tagsForURL: FrameToDisplay) => {
  if (tagsForURL.type !== "XMTP_FRAME" && tagsForURL.type !== "FRAME")
    return [];
  const buttons: FrameButtonType[] = [];

  const button1 = tagsForURL.extractedTags["fc:frame:button:1"];

  if (button1) {
    buttons.push({
      index: 1,
      title: button1,
      action: getFrameButtonAction(tagsForURL, 1),
    });
    const button2 = tagsForURL.extractedTags["fc:frame:button:2"];
    if (button2) {
      buttons.push({
        index: 2,
        title: button2,
        action: getFrameButtonAction(tagsForURL, 2),
      });
      const button3 = tagsForURL.extractedTags["fc:frame:button:3"];
      if (button3) {
        buttons.push({
          index: 3,
          title: button3,
          action: getFrameButtonAction(tagsForURL, 3),
        });
        const button4 = tagsForURL.extractedTags["fc:frame:button:4"];
        if (button4) {
          buttons.push({
            index: 4,
            title: button4,
            action: getFrameButtonAction(tagsForURL, 4),
          });
        }
      }
    }
  }
  return buttons;
};

const frameClientByAccount: { [account: string]: FramesClient } = {};
const creatingFramesClientForAccount: { [account: string]: boolean } = {};

export const getFramesClient = async (account: string) => {
  while (creatingFramesClientForAccount[account]) {
    await new Promise((r) => setTimeout(r, 200));
  }
  if (frameClientByAccount[account]) return frameClientByAccount[account];
  try {
    creatingFramesClientForAccount[account] = true;
    // The FramesClient only works with the JS SDK - ok for now
    const base64Key = await loadXmtpKey(account);
    if (!base64Key)
      throw new Error(
        `[FramesClient] Could not instantiate client for account ${account}`
      );
    const jsClient = await Client.create(null, {
      env: config.xmtpEnv as "dev" | "production" | "local",
      privateKeyOverride: Buffer.from(base64Key, "base64"),
    });
    frameClientByAccount[account] = new FramesClient(jsClient);
    delete creatingFramesClientForAccount[account];
    return frameClientByAccount[account];
  } catch (e) {
    delete creatingFramesClientForAccount[account];
    throw e;
  }
};

type FrameAction = "post" | "post_redirect" | "link";

export const getFrameButtonAction = (
  tags: FrameToDisplay,
  buttonIndex: number
) => {
  return (tags.extractedTags[`fc:frame:button:${buttonIndex}:action`] ||
    "post") as FrameAction;
};

export const getFrameButtonLinkTarget = (
  tags: FrameToDisplay,
  buttonIndex: number
) => {
  return tags.extractedTags[`fc:frame:button:${buttonIndex}:target`] as
    | string
    | undefined;
};

export const getFrameAspectRatio = (frame: FrameToDisplay) =>
  frame.extractedTags["of:image:aspect_ratio"] ||
  frame.extractedTags["fc:frame:image:aspect_ratio"] ||
  "1.91:1";

export const getFrameImage = (frame: FrameToDisplay) =>
  frame.type === "PREVIEW"
    ? frame.extractedTags["og:image"]
    : frame.extractedTags["fc:frame:image"];

export const getFramePostURL = (frame: FrameToDisplay) =>
  frame.extractedTags["of:post_url"] ||
  frame.extractedTags["fc:frame:post_url"];

export const getFrameTextInput = (frame: FrameToDisplay) =>
  (frame.extractedTags["of:input:text	"] ||
    frame.extractedTags["fc:frame:input:text"]) as string | undefined;
