import { MigrationInterface, QueryRunner } from "typeorm";

// We modified the precedent migration to remove the foreign key but
// it was already released in closed testers. This migration will
// check if there is a foreign key and if yes, will re-apply the migration
// At the same time, we add a nice index on `conversationId` for faster queries

export class removeForeignKeyForTesters1690989046000
  implements MigrationInterface
{
  name = "removeForeignKeyForTesters1690989046000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasForeignKey = await queryRunner.query(
      `PRAGMA foreign_key_list(message);`
    );
    if (hasForeignKey.length > 0) {
      console.log(
        "Database has a foreign key - this is a tester - reapplying migration"
      );
      // Re-apply precedent migration
      await queryRunner.query(
        `CREATE TABLE "temporary_message" ("id" text PRIMARY KEY NOT NULL, "senderAddress" text NOT NULL, "sent" integer NOT NULL, "content" text NOT NULL, "conversationId" text NOT NULL, "status" text NOT NULL DEFAULT ('sent'), "sentViaConverse" boolean NOT NULL DEFAULT (0), "contentType" text NOT NULL DEFAULT ('xmtp.org/text:1.0'), "reactions" text NOT NULL DEFAULT ('{}'), "contentFallback" text);`
      );
      await queryRunner.query(
        `INSERT INTO "temporary_message"("id", "senderAddress", "sent", "content", "conversationId", "status", "sentViaConverse", "contentType", "reactions", "contentFallback") SELECT "id", "senderAddress", "sent", "content", "conversationId", "status", "sentViaConverse", "contentType", "reactions", "contentFallback" FROM "message";`
      );
      await queryRunner.query(`DROP TABLE "message";`);
      await queryRunner.query(
        `ALTER TABLE "temporary_message" RENAME TO "message";`
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_14fde3d0ed2191ef415d5f759d" ON "message" ("status")`
      );
    }
    // Adding the index
    await queryRunner.query(
      `CREATE INDEX "IDX_7cf4a4df1f2627f72bf6231635" ON "message" ("conversationId") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_7cf4a4df1f2627f72bf6231635"`);
  }
}
