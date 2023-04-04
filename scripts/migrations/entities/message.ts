import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm";

import { type Conversation } from "./conversation";

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

  @Column("text", { default: "sent" })
  status!: "sending" | "sent" | "received" | "read" | "error";

  @Column("text")
  conversationId!: string;

  @ManyToOne(
    "Conversation",
    (conversation: Conversation) => conversation.messages
  )
  @JoinColumn({ name: "conversationId" })
  conversation?: Conversation;
}
