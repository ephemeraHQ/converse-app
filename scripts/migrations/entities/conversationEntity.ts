import { Index, Entity, Column, PrimaryColumn, OneToMany } from "typeorm";

import { type Message } from "./messageEntity";

@Entity()
export class Conversation {
  @PrimaryColumn("text")
  topic!: string;

  @Index()
  @Column("boolean", { default: false })
  pending!: boolean;

  @Index()
  @Column("text", { nullable: true })
  peerAddress?: string;

  @Column("boolean", { default: false })
  isGroup!: boolean;

  @Column("simple-array", { nullable: true })
  groupAdmins?: string[];

  @Column("text", { nullable: true })
  groupPermissionLevel?: string;

  @Column("simple-array", { nullable: true })
  groupMembers?: string[];

  @Column("int")
  createdAt!: number;

  @Column("int", { nullable: false, default: 0 })
  readUntil!: number;

  @Column("text", { nullable: true })
  contextConversationId?: string;

  @Column("text", { nullable: true })
  contextMetadata?: string;

  @Column("text", { default: "v2" })
  version!: string;

  @Column("decimal", { precision: 6, scale: 2, nullable: true, default: null })
  spamScore?: number;

  @OneToMany("Message", (message: Message) => message.conversation, {
    // Disabling foreign key creation to be able to save messages from not-yet known conversations
    createForeignKeyConstraints: false,
  })
  messages?: Message[];
}
