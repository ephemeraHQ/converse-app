import {
  Index,
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
} from "typeorm/browser";

import { type Message } from "./messageEntity";

@Entity()
export class Conversation {
  // @ts-ignore
  public static name = "Conversation";

  @PrimaryColumn("text")
  topic!: string;

  @Index()
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

  @OneToMany("Message", (message: Message) => message.conversation, {
    // Disabling foreign key creation to be able to save messages from not-yet known conversations
    createForeignKeyConstraints: false,
  })
  messages?: Message[];
}
