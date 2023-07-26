import {
  Index,
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
} from "typeorm/browser";

import { type Message } from "./message";

@Entity()
export class Conversation {
  // @ts-ignore
  public static name = "Conversation";

  @PrimaryColumn("text")
  topic!: string;

  @Column("boolean", { default: false })
  pending!: boolean;

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
