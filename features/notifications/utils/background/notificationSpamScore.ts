import {
  ConverseXmtpClientType,
  DecodedMessageWithCodecsType,
  GroupWithCodecsType,
} from "@utils/xmtpRN/client";
import { isContentType } from "@utils/xmtpRN/contentTypes";
import { getSendersSpamScores } from "@/utils/api";
import { InboxId } from "@xmtp/react-native-sdk";
import { computeMessageContentSpamScore } from "@/data/helpers/conversations/spamScore";

export const computeSpamScoreGroupWelcome = async (
  xmtpClient: ConverseXmtpClientType,
  group: GroupWithCodecsType
): Promise<number> => {
  try {
    await xmtpClient.contacts.refreshConsentList();

    const groupAllowed = await xmtpClient.contacts.isGroupAllowed(group.id);
    if (groupAllowed) {
      return -1;
    }

    const inviterInboxId = await group.addedByInboxId;
    const inviterAllowed =
      await xmtpClient.contacts.isInboxAllowed(inviterInboxId);
    if (inviterAllowed) {
      return -1;
    }

    const inviterDenied =
      await xmtpClient.contacts.isInboxDenied(inviterInboxId);
    if (inviterDenied) {
      return 1;
    }

    const members = await group.members();
    const inviter = members.find((m) => m.inboxId === inviterInboxId);

    if (inviter?.addresses?.length) {
      for (const address of inviter.addresses) {
        if (await xmtpClient.contacts.isDenied(address)) {
          return 1;
        }
      }

      for (const address of inviter.addresses) {
        if (await xmtpClient.contacts.isAllowed(address)) {
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
    await xmtpClient.contacts.refreshConsentList();

    const groupDenied = await xmtpClient.contacts.isGroupDenied(group.id);
    if (groupDenied) {
      return 1;
    }

    const senderInboxId = decodedMessage.senderAddress as InboxId;
    const senderDenied = await xmtpClient.contacts.isInboxDenied(senderInboxId);
    if (senderDenied) {
      return 1;
    }

    const senderAllowed =
      await xmtpClient.contacts.isInboxAllowed(senderInboxId);
    if (senderAllowed) {
      return -1;
    }

    const groupAllowed = await xmtpClient.contacts.isGroupAllowed(group.id);
    if (groupAllowed) {
      return -1;
    }

    const members = await group.members();
    const sender = members.find((m) => m.inboxId === senderInboxId);

    if (sender?.addresses?.length) {
      for (const address of sender.addresses) {
        if (await xmtpClient.contacts.isDenied(address)) {
          return 1;
        }
      }

      for (const address of sender.addresses) {
        if (await xmtpClient.contacts.isAllowed(address)) {
          return -1;
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }

  let messageSpamScore = 0;

  if (
    isContentType("text", decodedMessage.contentTypeId) &&
    decodedMessage.nativeContent.text
  ) {
    messageSpamScore = computeMessageContentSpamScore(
      decodedMessage.nativeContent.text,
      decodedMessage.contentTypeId
    );
  }

  return senderSpamScore + messageSpamScore;
};
