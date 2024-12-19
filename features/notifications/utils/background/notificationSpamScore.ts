import {
  ConverseXmtpClientType,
  DecodedMessageWithCodecsType,
  GroupWithCodecsType,
} from "@utils/xmtpRN/client";
import { isContentType } from "@/utils/xmtpRN/content-types/content-types";
import { getSendersSpamScores } from "@/utils/api";
import { InboxId } from "@xmtp/react-native-sdk";
import { computeMessageContentSpamScore } from "@/data/helpers/conversations/spamScore";

export const computeSpamScoreGroupWelcome = async (
  xmtpClient: ConverseXmtpClientType,
  group: GroupWithCodecsType
): Promise<number> => {
  try {
    await xmtpClient.preferences.syncConsent();

    const groupAllowed = await xmtpClient.preferences.conversationConsentState(
      group.id
    );
    if (groupAllowed === "allowed") {
      return -1;
    }

    const inviterInboxId = await group.addedByInboxId;
    const inviterConsentState =
      await xmtpClient.preferences.inboxIdConsentState(inviterInboxId);
    const inviterAllowed = inviterConsentState === "allowed";
    const inviterDenied = inviterConsentState === "denied";

    if (inviterAllowed) {
      return -1;
    }

    if (inviterDenied) {
      return 1;
    }

    const members = await group.members();
    const inviter = members.find((m) => m.inboxId === inviterInboxId);

    if (inviter?.addresses?.length) {
      for (const address of inviter.addresses) {
        const addressConsentState =
          await xmtpClient.preferences.addressConsentState(address);
        if (addressConsentState === "denied") {
          return 1;
        }
      }

      for (const address of inviter.addresses) {
        const addressConsentState =
          await xmtpClient.preferences.addressConsentState(address);
        if (addressConsentState === "allowed") {
          return -1;
        }
      }

      const inviterAddress = inviter.addresses[0];
      if (inviterAddress) {
        const senderSpamScore = (await getSendersSpamScores([inviterAddress]))[
          inviterAddress
        ];

        return senderSpamScore;
      }
    }
  } catch (error) {
    return 0;
  }

  return 0;
};

export const computeSpamScoreGroupMessage = async (
  xmtpClient: ConverseXmtpClientType,
  group: GroupWithCodecsType,
  decodedMessage: DecodedMessageWithCodecsType
): Promise<number> => {
  let senderSpamScore = 0;

  try {
    // await xmtpClient.preferences.syncConsent();

    const groupConsentState =
      await xmtpClient.preferences.conversationConsentState(group.id);
    if (groupConsentState === "denied") {
      return 1;
    }

    const senderInboxId = decodedMessage.senderInboxId as InboxId;
    const senderConsentState =
      await xmtpClient.preferences.inboxIdConsentState(senderInboxId);
    if (senderConsentState === "denied") {
      return 1;
    }

    const senderAllowed = senderConsentState === "allowed";
    if (senderAllowed) {
      return -1;
    }

    const groupAllowed = groupConsentState === "allowed";
    if (groupAllowed) {
      return -1;
    }

    const members = await group.members();
    const sender = members.find((m) => m.inboxId === senderInboxId);

    if (sender?.addresses?.length) {
      for (const address of sender.addresses) {
        const addressConsentState =
          await xmtpClient.preferences.addressConsentState(address);
        if (addressConsentState === "denied") {
          return 1;
        }
      }

      for (const address of sender.addresses) {
        const addressConsentState =
          await xmtpClient.preferences.addressConsentState(address);
        if (addressConsentState === "allowed") {
          return -1;
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }

  let messageSpamScore = 0;

  if (
    isContentType({
      type: "text",
      contentType: decodedMessage.contentTypeId,
    }) &&
    decodedMessage.nativeContent.text
  ) {
    messageSpamScore = computeMessageContentSpamScore(
      decodedMessage.nativeContent.text,
      "text"
    );
  }

  return senderSpamScore + messageSpamScore;
};
