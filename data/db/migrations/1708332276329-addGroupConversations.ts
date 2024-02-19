import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGroupConversations1708332276329 implements MigrationInterface {
  name = "AddGroupConversations1708332276329";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_134e668e0d62c7cd93624ea4d5"`);
    await queryRunner.query(`DROP INDEX "IDX_b895a35679cdf0702fb2218718"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_conversation" ("topic" text PRIMARY KEY NOT NULL, "peerAddress" text, "createdAt" integer NOT NULL, "contextConversationId" text, "contextMetadata" text, "readUntil" integer NOT NULL DEFAULT (0), "pending" boolean NOT NULL DEFAULT (0), "version" text NOT NULL DEFAULT ('v2'), "spamScore" decimal(6,2), "isGroup" boolean NOT NULL DEFAULT (0), "groupMembers" text)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_conversation"("topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "readUntil", "pending", "version", "spamScore") SELECT "topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "readUntil", "pending", "version", "spamScore" FROM "conversation"`
    );
    await queryRunner.query(`DROP TABLE "conversation"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_conversation" RENAME TO "conversation"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_134e668e0d62c7cd93624ea4d5" ON "conversation" ("pending") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b895a35679cdf0702fb2218718" ON "conversation" ("peerAddress") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_b895a35679cdf0702fb2218718"`);
    await queryRunner.query(`DROP INDEX "IDX_134e668e0d62c7cd93624ea4d5"`);
    await queryRunner.query(
      `ALTER TABLE "conversation" RENAME TO "temporary_conversation"`
    );
    await queryRunner.query(
      `CREATE TABLE "conversation" ("topic" text PRIMARY KEY NOT NULL, "peerAddress" text NOT NULL, "createdAt" integer NOT NULL, "contextConversationId" text, "contextMetadata" text, "readUntil" integer NOT NULL DEFAULT (0), "pending" boolean NOT NULL DEFAULT (0), "version" text NOT NULL DEFAULT ('v2'), "spamScore" decimal(6,2))`
    );
    await queryRunner.query(
      `INSERT INTO "conversation"("topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "readUntil", "pending", "version", "spamScore") SELECT "topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "readUntil", "pending", "version", "spamScore" FROM "temporary_conversation"`
    );
    await queryRunner.query(`DROP TABLE "temporary_conversation"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_b895a35679cdf0702fb2218718" ON "conversation" ("peerAddress") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_134e668e0d62c7cd93624ea4d5" ON "conversation" ("pending") `
    );
  }
}
