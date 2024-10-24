import { MessageReaction } from "../../../../utils/reactions";

export type MessageReactions = {
  [senderAddress: string]: MessageReaction[];
};
