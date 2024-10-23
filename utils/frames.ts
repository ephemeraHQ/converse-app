import { debugEnabled } from "@components/DebugButton";
import { OpenFramesProxy } from "@open-frames/proxy-client";
import {
  GetMetadataResponse,
  OpenFrameButtonResult,
} from "@open-frames/proxy-types";
import {
  FramesApiResponse,
  FramesClient,
  OPEN_FRAMES_PROXY_URL,
} from "@xmtp/frames-client";
import { BigNumber, ethers } from "ethers";
import { hexValue } from "ethers/lib/utils";

import logger from "./logger";
import { URL_REGEX } from "./regex";
import { strByteSize } from "./str";
import { extractChainIdToHex } from "./transaction";
import { isContentType } from "./xmtpRN/contentTypes";
import { getXmtpClient } from "./xmtpRN/sync";
import { MessageToDisplay } from "../components/Chat/Message/Message";
import { ConverseMessageMetadata } from "../data/db/entities/messageEntity";
import { saveMessageMetadata } from "../data/helpers/messages";
import { useFramesStore } from "../data/store/framesStore";

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
    const urls = (message.content.match(URL_REGEX) || []).filter((u) => {
      const lower = u.toLowerCase();
      return lower.startsWith("http://") || lower.startsWith("https://");
    });
    const fetchedFrames: FrameWithType[] = [];
    if (urls.length > 0) {
      logger.debug(
        `[FramesMetadata] Fetching Open Graph tags for ${
          debugEnabled(account) ? urls : "<redacted>"
        }`
      );
      const uniqueUrls = Array.from(new Set(urls));
      const framesClient = await getFramesClient(account);
      const urlsMetadata = await Promise.all(
        uniqueUrls.map((u) =>
          framesClient.proxy
            .readMetadata(u)
            .catch((e) => logger.warn(`[FramesMetadata] ${e}`))
        )
      );

      const framesToSave: { [url: string]: FrameWithType } = {};

      urlsMetadata.forEach((response) => {
        if (
          response?.extractedTags &&
          Object.keys(response.extractedTags).length > 0
        ) {
          const validatedFrame = validateFrame(response);
          if (validatedFrame) {
            fetchedFrames.push(validatedFrame);
            // Save lowercased frame url
            framesToSave[response.url.toLowerCase()] = validatedFrame;
            // Save lowercase frame url with slash if no slash already
            const lastCharacter = response.url.charAt(response.url.length - 1);
            if (lastCharacter === "/") {
              framesToSave[`${response.url.toLowerCase()}/`] = validatedFrame;
            }
          }
        }
      });

      // Save frames urls list on message
      const messageMetadataToSave: ConverseMessageMetadata = {
        frames: fetchedFrames.map((f) => f.url),
      };
      // Save frame to store
      useFramesStore.getState().setFrames(framesToSave);
      // Then update message to reflect change
      saveMessageMetadata(account, message, messageMetadataToSave);

      return { messageId: message.id, frames: fetchedFrames };
    }
  }
  return { messageId: message.id, frames: [] };
};

export type FrameButtonType = OpenFrameButtonResult & {
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

export const handleTxAction = async (
  frame: FrameToDisplay,
  button: FrameButtonType,
  payload: any,
  provider: ethers.providers.Web3Provider
) => {
  // @todo => proxy should get upgraded to extract post url from button
  const buttonPostUrl =
    frame.extractedTags[`fc:frame:button:${button.index}:post_url`];
  const buttonTarget = button.target;
  if (!buttonPostUrl || !buttonTarget)
    throw new Error("Missing postUrl or target");
  const txData = await framesProxy.postTransaction(buttonTarget, payload);
  if (txData.method !== "eth_sendTransaction") {
    throw new Error("method should be eth_sendTransaction");
  }
  const hexChainId = extractChainIdToHex(txData.chainId.replace("eip155:", ""));
  if (
    ![
      "0x5d50",
      "0xaa37dc",
      "0x12c",
      "0xe705",
      "0x14a34",
      "0x66eee",
      "0x8274f",
      "0xaa36a7",
      "0x134d7c4",
      "0xa0c71fd",
      "0x3b9ac9ff",
      "0x6b6b7274",
    ].includes(hexChainId)
  ) {
    alert("Transaction frames support only Sepolia testnets for now");
    throw new Error("Transaction frames support only Sepolia testnets for now");
  }
  try {
    await provider.send?.("wallet_switchEthereumChain", [
      {
        chainId: hexChainId,
      },
    ]);
  } catch (e: any) {
    if (e.code !== 4001) {
      alert(
        `Could not switch to chain ${txData.chainId}\nPlease check that this chain is configured in your wallet.`
      );
    }
    throw e;
  }

  const account = (await provider.listAccounts())[0];
  const txHash = await provider.send(txData.method, [
    {
      from: account,
      to: txData.params.to,
      data: txData.params.data ? hexValue(txData.params.data) : undefined,
      value: hexValue(BigNumber.from(txData.params.value || "0").toHexString()),
    },
  ]);

  const transactionReceipt = await provider.getTransaction(txHash);

  if (
    transactionReceipt.to?.toLowerCase() !== txData.params.to.toLowerCase() ||
    transactionReceipt.value.toBigInt() !== BigInt(txData.params.value || 0)
  ) {
    // Error handle, shouldn't show frame success screen
    throw new Error("transaction failed");
  }
  return { buttonPostUrl, txHash };
};

export const isFrameMessage = (
  message: MessageToDisplay,
  framesStore: {
    [frameUrl: string]: FrameWithType;
  }
): boolean => {
  return (
    isContentType("text", message.contentType) &&
    !!message.converseMetadata?.frames?.[0] &&
    !!framesStore[message.converseMetadata.frames[0].toLowerCase().trim()]
  );
};
