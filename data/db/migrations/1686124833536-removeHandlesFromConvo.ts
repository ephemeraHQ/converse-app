import { MigrationInterface, QueryRunner } from "typeorm";

export class removeHandlesFromConvo1686124833536 implements MigrationInterface {
  name = "removeHandlesFromConvo1686124833536";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop index on conversation
    await queryRunner.query(`DROP INDEX "IDX_b895a35679cdf0702fb2218718"`);
    // Drop index on message
    await queryRunner.query(`DROP INDEX "IDX_14fde3d0ed2191ef415d5f759d"`);
    // Create temporary conversation with columns removed
    await queryRunner.query(
      `CREATE TABLE "temporary_conversation" ("topic" text PRIMARY KEY NOT NULL, "peerAddress" text NOT NULL, "createdAt" integer NOT NULL, "contextConversationId" text, "contextMetadata" text, "readUntil" integer NOT NULL DEFAULT (0))`
    );
    // Insert all values in temporary conversations
    await queryRunner.query(
      `INSERT INTO "temporary_conversation"("topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "readUntil") SELECT "topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "readUntil" FROM "conversation"`
    );
    // Create temporary message that will reference new conversation table
    await queryRunner.query(
      `CREATE TABLE "temporary_message" ("id" text PRIMARY KEY NOT NULL, "senderAddress" text NOT NULL, "sent" integer NOT NULL, "content" text NOT NULL, "conversationId" text NOT NULL, "status" text NOT NULL DEFAULT ('sent'), "sentViaConverse" boolean NOT NULL DEFAULT (0), CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f" FOREIGN KEY ("conversationId") REFERENCES "temporary_conversation" ("topic") ON DELETE NO ACTION ON UPDATE NO ACTION)`
    );
    // Insert all messages in temporary messages
    await queryRunner.query(
      `INSERT INTO "temporary_message" ("id", "senderAddress", "sent", "content", "conversationId", "status", "sentViaConverse") SELECT "id", "senderAddress", "sent", "content", "conversationId", "status", "sentViaConverse" FROM "message"`
    );
    // Drop the message table
    await queryRunner.query(`DROP TABLE "message"`);
    // Drop the conversation table
    await queryRunner.query(`DROP TABLE "conversation"`);
    // Rename the temporary tables
    await queryRunner.query(
      `ALTER TABLE "temporary_message" RENAME TO "message"`
    );
    await queryRunner.query(
      `ALTER TABLE "temporary_conversation" RENAME TO "conversation"`
    );
    // Recreate indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_b895a35679cdf0702fb2218718" ON "conversation" ("peerAddress") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_14fde3d0ed2191ef415d5f759d" ON "message" ("status") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_b895a35679cdf0702fb2218718"`);
    await queryRunner.query(
      `ALTER TABLE "conversation" RENAME TO "temporary_conversation"`
    );
    await queryRunner.query(
      `CREATE TABLE "conversation" ("topic" text PRIMARY KEY NOT NULL, "peerAddress" text NOT NULL, "createdAt" integer NOT NULL, "contextConversationId" text, "contextMetadata" text, "lensHandle" text, "ensName" text, "handlesUpdatedAt" integer, "readUntil" integer NOT NULL DEFAULT (0))`
    );
    await queryRunner.query(
      `INSERT INTO "conversation"("topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "readUntil") SELECT "topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "readUntil" FROM "temporary_conversation"`
    );
    await queryRunner.query(`DROP TABLE "temporary_conversation"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_b895a35679cdf0702fb2218718" ON "conversation" ("peerAddress") `
    );
  }
}
