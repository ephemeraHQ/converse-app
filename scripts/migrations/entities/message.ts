import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

import { type Conversation } from "./conversation";

export type MessageReaction = {
  action: "added" | "removed";
  content: string;
  senderAddress: string;
  sent: number;
};

@Entity()
export class Message {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  senderAddress!: string;

  @Column("int")
  sent!: number;

  @Column("text")
  content!: string;

  @Index()
  @Column("text", { default: "sent" })
  status!: "delivered" | "error" | "seen" | "sending" | "sent";

  @Column("boolean", { default: false })
  sentViaConverse!: boolean;

  @Column("text")
  conversationId!: string;

  @Column("text", { default: "xmtp.org/text:1.0" })
  contentType!: string;

  @Column("text", { default: "[]" })
  reactions!: string;

  @ManyToOne(
    "Conversation",
    (conversation: Conversation) => conversation.messages
  )
  @JoinColumn({ name: "conversationId" })
  conversation?: Conversation;

  getReactions() {
    // Returns the last reaction for each sender
    try {
      const reactions = JSON.parse(this.reactions) as MessageReaction[];
      const sortedReactions = reactions.sort((a, b) => b.sent - a.sent);
      const lastReactionBySender: { [senderAddress: string]: MessageReaction } =
        {};
      sortedReactions.forEach((reaction) => {
        if (reaction.action === "removed") {
          delete lastReactionBySender[reaction.senderAddress];
        } else {
          lastReactionBySender[reaction.senderAddress] = reaction;
        }
      });

      return lastReactionBySender;
    } catch (error) {
      const data = { error, reactions: this.reactions };
      console.log(data);
      return {};
    }
  }
}
