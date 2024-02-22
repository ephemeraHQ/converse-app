import { FramesApiResponse, FramesClient } from "@xmtp/frames-client";
import { Client } from "@xmtp/xmtp-js";

import { MessageToDisplay } from "../components/Chat/ChatMessage";
import config from "../config";
import { loadXmtpKey } from "./keychain/helpers";
import { URL_REGEX } from "./regex";
import { isContentType } from "./xmtpRN/contentTypes";

export type FrameToDisplay = FramesApiResponse & {
  type: "FRAME" | "XMTP_FRAME" | "PREVIEW";
  framesClient: FramesClient;
};

export type FramesForMessage = {
  messageId: string;
  framesToDisplay: FrameToDisplay[];
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
  // OG Preview / Frames are only for text content type
  if (isContentType("text", message.contentType)) {
    const urls = message.content.match(URL_REGEX);
    const extractedTags: FrameToDisplay[] = [];
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

      urlsMetadata.forEach((response) => {
        if (response && Object.keys(response.extractedTags).length > 0) {
          const frameType = getFrameType(response.extractedTags);
          if (frameType) {
            extractedTags.push({
              ...response,
              type: frameType,
              framesClient,
            });
          }
        }
      });

      return { messageId: message.id, framesToDisplay: extractedTags };
    }
  }
  return { messageId: message.id, framesToDisplay: [] };
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

export const getFramesClient = async (account: string) => {
  if (frameClientByAccount[account]) return frameClientByAccount[account];
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
  return frameClientByAccount[account];
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
