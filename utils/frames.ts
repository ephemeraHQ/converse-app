import { FramesClient } from "@xmtp/frames-client";
// Support for frames and OG tags

import { MessageToDisplay } from "../components/Chat/ChatMessage";
import { URL_REGEX } from "./regex";
import { isContentType } from "./xmtpRN/contentTypes";

export type TagsForURL = Awaited<
  ReturnType<typeof FramesClient.readMetadata>
> & {
  type: "FRAME" | "XMTP_FRAME" | "PREVIEW";
};

const getFrameType = (tags: TagsForURL["extractedTags"]) => {
  if (tags["fc:frame"] !== "vNext") return undefined;
  if (!tags["fc:frame:image"]) return undefined;
  if (tags["xmtp:frame:post-url"]) return "XMTP_FRAME";
  return "FRAME";
};

export const getMetadaTagsForMessage = async (
  message: MessageToDisplay
): Promise<TagsForURL[]> => {
  // OG Preview / Frames are only for text content type
  if (isContentType("text", message.contentType)) {
    const urls = message.content.match(URL_REGEX);
    const extractedTags: TagsForURL[] = [];
    if (urls) {
      console.log(
        `[FramesMetadata] Found ${urls.length} URLs in message, fetching tags`
      );
      const urlsMetadata = await Promise.all(
        urls.map(
          (u) => FramesClient.readMetadata(u).catch((e) => console.error(e)) // We agree to have one frame that fails to preview
        )
      );

      urlsMetadata.forEach((response) => {
        if (response && Object.keys(response.extractedTags).length > 0) {
          const frameType = getFrameType(response.extractedTags);
          if (frameType) {
            extractedTags.push({ ...response, type: frameType });
          }
        }
      });

      return extractedTags;
    }
  }
  return [];
};

export const getFrameButtons = (tagsForURL: TagsForURL) => {
  // @todo => uncomment
  // if (tagsForURL.type !== "XMTP_FRAME") return [];
  const buttons: string[] = [];

  const button1 = tagsForURL.extractedTags["fc:frame:button:1"];

  if (button1) {
    buttons.push(button1);
    const button2 = tagsForURL.extractedTags["fc:frame:button:2"];
    if (button2) {
      buttons.push(button2);
      const button3 = tagsForURL.extractedTags["fc:frame:button:3"];
      if (button3) {
        buttons.push(button3);
        const button4 = tagsForURL.extractedTags["fc:frame:button:4"];
        if (button4) {
          buttons.push(button4);
        }
      }
    }
  }
  return buttons;
};
