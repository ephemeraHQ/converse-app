import { Column, Entity, Index, OneToMany, PrimaryColumn } from "typeorm";

import { type Message } from "./messageEntity";

// Caution, when adding booleans here, they're not mapped correctly when
// using createQueryBuilder directly (as they're actually integers in Sqlite)
// see https://github.com/Unshut-Labs/converse-app/commit/5e498c99c3c1928f0256d3461299e9e5a0386b12

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

  @Column("simple-array", { nullable: true })
  groupSuperAdmins?: string[];

  @Column("text", { nullable: true })
  groupPermissionLevel?: string;

  @Column("text", { nullable: true })
  groupName?: string;

  @Column("simple-array", { nullable: true })
  groupMembers?: string[];

  @Column("boolean", { nullable: true })
  isActive?: boolean;

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

  @Column("int", { nullable: true })
  lastNotificationsSubscribedPeriod?: number;
}
