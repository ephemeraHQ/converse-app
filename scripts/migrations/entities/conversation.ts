import { Index, Entity, Column, PrimaryColumn, OneToMany } from "typeorm";

import { type Message } from "./message";

@Entity()
export class Conversation {
  @PrimaryColumn("text")
  topic!: string;

  @Index()
  @Column("text")
  peerAddress!: string;

  @Column("int")
  createdAt!: number;

  @Column("int", { nullable: false, default: 0 })
  readUntil!: number;

  @Column("text", { nullable: true })
  contextConversationId?: string;

  @Column("text", { nullable: true })
  contextMetadata?: string;

  @OneToMany("Message", (message: Message) => message.conversation)
  messages?: Message[];
}
