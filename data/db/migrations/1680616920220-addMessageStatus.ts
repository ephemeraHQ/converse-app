import { MigrationInterface, QueryRunner } from "typeorm";

export class addMessageStatus1680616920220 implements MigrationInterface {
  name = "addMessageStatus1680616920220";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_conversation" ("topic" text PRIMARY KEY NOT NULL, "peerAddress" text NOT NULL, "createdAt" integer NOT NULL, "contextConversationId" text, "contextMetadata" text, "lensHandle" text, "ensName" text, "handlesUpdatedAt" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_conversation"("topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "lensHandle", "ensName", "handlesUpdatedAt") SELECT "topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "lensHandle", "ensName", "handlesUpdatedAt" FROM "conversation"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_message" ("id" text PRIMARY KEY NOT NULL, "senderAddress" text NOT NULL, "sent" integer NOT NULL, "content" text NOT NULL, "conversationId" text NOT NULL, "status" text NOT NULL DEFAULT ('sent'), CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f" FOREIGN KEY ("conversationId") REFERENCES "temporary_conversation" ("topic") ON DELETE NO ACTION ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_message"("id", "senderAddress", "sent", "content", "conversationId") SELECT "id", "senderAddress", "sent", "content", "conversationId" FROM "message"`
    );
    await queryRunner.query(`DROP TABLE "message"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_message" RENAME TO "message"`
    );
    await queryRunner.query(`DROP TABLE "conversation"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_conversation" RENAME TO "conversation"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation" RENAME TO "temporary_conversation"`
    );
    await queryRunner.query(
      `CREATE TABLE "conversation" ("topic" text PRIMARY KEY NOT NULL, "peerAddress" text NOT NULL, "createdAt" integer NOT NULL, "contextConversationId" text, "contextMetadata" text, "lensHandle" text DEFAULT (NULL), "ensName" text DEFAULT (NULL), "handlesUpdatedAt" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "conversation"("topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "lensHandle", "ensName", "handlesUpdatedAt") SELECT "topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "lensHandle", "ensName", "handlesUpdatedAt" FROM "temporary_conversation"`
    );
    await queryRunner.query(`DROP TABLE "temporary_conversation"`);
    await queryRunner.query(
      `ALTER TABLE "message" RENAME TO "temporary_message"`
    );
    await queryRunner.query(
      `CREATE TABLE "message" ("id" text PRIMARY KEY NOT NULL, "senderAddress" text NOT NULL, "sent" integer NOT NULL, "content" text NOT NULL, "conversationId" text NOT NULL, CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f" FOREIGN KEY ("conversationId") REFERENCES "conversation" ("topic") ON DELETE NO ACTION ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "message"("id", "senderAddress", "sent", "content", "conversationId") SELECT "id", "senderAddress", "sent", "content", "conversationId" FROM "temporary_message"`
    );
    await queryRunner.query(`DROP TABLE "temporary_message"`);
  }
}
