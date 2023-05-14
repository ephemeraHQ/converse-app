import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

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

  @Index()
  @Column("text", { default: "sent" })
  status!: "delivered" | "error" | "seen" | "sending" | "sent";

  @Column("boolean", { default: false })
  sentViaConverse!: boolean;

  @Column("text")
  conversationId!: string;

  @ManyToOne(
    "Conversation",
    (conversation: Conversation) => conversation.messages
  )
  @JoinColumn({ name: "conversationId" })
  conversation?: Conversation;
}
