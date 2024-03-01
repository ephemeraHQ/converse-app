import { getRepository } from "../../db";

export const getMessagesToSend = async (account: string) => {
  const messageRepository = await getRepository(account, "message");
  const messagesToSend = await messageRepository.find({
    select: {
      id: true,
      conversationId: true,
      contentType: true,
      content: true,
      contentFallback: true,
      referencedMessageId: true,
    },
    where: {
      status: "sending",
      conversation: {
        pending: false,
      },
    },
    order: {
      sent: "ASC",
    },
  });
  return messagesToSend;
};
