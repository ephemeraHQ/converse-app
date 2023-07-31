import { MigrationInterface, QueryRunner } from "typeorm";

// One of our migrations messed up the database state with the `message` table
// having a foreign key on `temporary_conversation` and not `conversation` anymore.
// Weirdest thing is it didn't impact the app until a few migrations after, I have
// no idea why. This migration fixes the state

export class fixWrongForeignKey1690809735000 implements MigrationInterface {
  name = "fixWrongForeignKey1690809735000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_message" ("id" text PRIMARY KEY NOT NULL, "senderAddress" text NOT NULL, "sent" integer NOT NULL, "content" text NOT NULL, "conversationId" text NOT NULL, "status" text NOT NULL DEFAULT ('sent'), "sentViaConverse" boolean NOT NULL DEFAULT (0), "contentType" text NOT NULL DEFAULT ('xmtp.org/text:1.0'), "reactions" text NOT NULL DEFAULT ('{}'), "contentFallback" text, CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f" FOREIGN KEY ("conversationId") REFERENCES "conversation" ("topic") ON DELETE NO ACTION ON UPDATE NO ACTION);`
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

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
