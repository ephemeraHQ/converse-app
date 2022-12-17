import { Entity, Column, PrimaryColumn, OneToMany } from "typeorm/browser";

import { Message } from "./message";

@Entity("conversation")
export class Conversation {
  @PrimaryColumn("text")
  topic!: string;

  @Column("text")
  peerAddress!: string;

  @Column("int")
  createdAt!: number;

  @Column("text", { nullable: true })
  contextConversationId?: string;

  @Column("text", { nullable: true })
  contextMetadata?: string;

  @OneToMany(() => Message, (message) => message.conversation)
  messages?: Message[];
}
