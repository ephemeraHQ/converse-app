import { Entity, Column, PrimaryColumn, OneToMany } from "typeorm/browser";

import { type Message } from "./message";

@Entity()
export class Conversation {
  // @ts-ignore
  public static name = "Conversation";

  @PrimaryColumn("text")
  topic!: string;

  @Column("text")
  peerAddress!: string;

  @Column("text", { nullable: true })
  lensHandle?: string | null;

  @Column("text", { nullable: true })
  ensName?: string | null;

  @Column("int")
  createdAt!: number;

  @Column("int", { nullable: true })
  handlesUpdatedAt?: number;

  @Column("int", { nullable: true })
  readUntil?: number;

  @Column("text", { nullable: true })
  contextConversationId?: string;

  @Column("text", { nullable: true })
  contextMetadata?: string;

  @OneToMany("Message", (message: Message) => message.conversation)
  messages?: Message[];
}
