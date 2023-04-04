import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm/browser";

import { type Conversation } from "./conversation";

@Entity()
export class Message {
  // @ts-ignore
  public static name = "Message";

  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  senderAddress!: string;

  @Column("int")
  sent!: number;

  @Column("text")
  content!: string;

  @Column("text", { default: "sent" })
  status!: "delivered" | "error" | "seen" | "sending" | "sent";

  @Column("text")
  conversationId!: string;

  @ManyToOne(
    "Conversation",
    (conversation: Conversation) => conversation.messages
  )
  @JoinColumn({ name: "conversationId" })
  conversation?: Conversation;
}
