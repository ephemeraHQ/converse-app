import { MigrationInterface, QueryRunner } from "typeorm";

export class removeOldReactions1691412759130 implements MigrationInterface {
  name = "removeOldReactions1691412759130";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_7f96058748fda6d300b9572c4f"`);
    await queryRunner.query(`DROP INDEX "IDX_7cf4a4df1f2627f72bf6231635"`);
    await queryRunner.query(`DROP INDEX "IDX_14fde3d0ed2191ef415d5f759d"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_message" ("id" text PRIMARY KEY NOT NULL, "senderAddress" text NOT NULL, "sent" integer NOT NULL, "content" text NOT NULL, "conversationId" text NOT NULL, "status" text NOT NULL DEFAULT ('sent'), "sentViaConverse" boolean NOT NULL DEFAULT (0), "contentType" text NOT NULL DEFAULT ('xmtp.org/text:1.0'), "contentFallback" text, "referencedMessageId" text)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_message"("id", "senderAddress", "sent", "content", "conversationId", "status", "sentViaConverse", "contentType", "contentFallback", "referencedMessageId") SELECT "id", "senderAddress", "sent", "content", "conversationId", "status", "sentViaConverse", "contentType", "contentFallback", "referencedMessageId" FROM "message"`
    );
    await queryRunner.query(`DROP TABLE "message"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_message" RENAME TO "message"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f96058748fda6d300b9572c4f" ON "message" ("referencedMessageId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7cf4a4df1f2627f72bf6231635" ON "message" ("conversationId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_14fde3d0ed2191ef415d5f759d" ON "message" ("status") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_14fde3d0ed2191ef415d5f759d"`);
    await queryRunner.query(`DROP INDEX "IDX_7cf4a4df1f2627f72bf6231635"`);
    await queryRunner.query(`DROP INDEX "IDX_7f96058748fda6d300b9572c4f"`);
    await queryRunner.query(
      `ALTER TABLE "message" RENAME TO "temporary_message"`
    );
    await queryRunner.query(
      `CREATE TABLE "message" ("id" text PRIMARY KEY NOT NULL, "senderAddress" text NOT NULL, "sent" integer NOT NULL, "content" text NOT NULL, "conversationId" text NOT NULL, "status" text NOT NULL DEFAULT ('sent'), "sentViaConverse" boolean NOT NULL DEFAULT (0), "contentType" text NOT NULL DEFAULT ('xmtp.org/text:1.0'), "contentFallback" text, "referencedMessageId" text, "reactions" text)`
    );
    await queryRunner.query(
      `INSERT INTO "message"("id", "senderAddress", "sent", "content", "conversationId", "status", "sentViaConverse", "contentType", "contentFallback", "referencedMessageId") SELECT "id", "senderAddress", "sent", "content", "conversationId", "status", "sentViaConverse", "contentType", "contentFallback", "referencedMessageId" FROM "temporary_message"`
    );
    await queryRunner.query(`DROP TABLE "temporary_message"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_14fde3d0ed2191ef415d5f759d" ON "message" ("status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7cf4a4df1f2627f72bf6231635" ON "message" ("conversationId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f96058748fda6d300b9572c4f" ON "message" ("referencedMessageId") `
    );
  }
}
