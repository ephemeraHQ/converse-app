import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from "typeorm";

import { type Conversation } from "./conversationEntity";

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

  @Column("text", { nullable: true })
  contentFallback?: string;

  @Index()
  @Column("text", { default: "sent" })
  status!: "delivered" | "error" | "seen" | "sending" | "sent";

  @Column("boolean", { default: false })
  sentViaConverse!: boolean;

  @Index()
  @Column("text")
  conversationId!: string;

  @Column("text", { default: "xmtp.org/text:1.0" })
  contentType!: string;

  @ManyToOne(
    "Conversation",
    (conversation: Conversation) => conversation.messages,
    // Disabling foreign key creation to be able to save messages from not-yet known conversations
    { createForeignKeyConstraints: false }
  )
  @JoinColumn({ name: "conversationId" })
  conversation?: Conversation;

  // Some messages reference another message
  // (reactions, replies)
  @Index()
  @Column("text", { nullable: true })
  referencedMessageId?: string;

  @ManyToOne(
    "Message",
    (message: Message) => message.referencingMessages,
    // Disabling foreign key creation to be able to save reactions from not-yet known messages
    { createForeignKeyConstraints: false }
  )
  @JoinColumn({ name: "referencedMessageId" })
  referencedMessage?: Message;

  @OneToMany(
    "Message",
    (message: Message) => message.referencedMessage,
    // Disabling foreign key creation to be able to save reactions from not-yet known messages
    { createForeignKeyConstraints: false }
  )
  @JoinColumn({ name: "referencedMessageId" })
  referencingMessages?: Message[];

  @Column("simple-json", { nullable: true })
  converseMetadata?: ConverseMessageMetadata;
}

export type ConverseMessageMetadata = {
  attachment?: {
    size: {
      width: number;
      height: number;
    };
  };
  frames?: string[];
};
