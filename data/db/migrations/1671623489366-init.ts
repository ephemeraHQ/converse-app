import { MigrationInterface, QueryRunner } from "typeorm";

export class init1671623489366 implements MigrationInterface {
  name = "init1671623489366";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "conversation" ("topic" text PRIMARY KEY NOT NULL, "peerAddress" text NOT NULL, "createdAt" integer NOT NULL, "contextConversationId" text, "contextMetadata" text)`
    );
    await queryRunner.query(
      `CREATE TABLE "message" ("id" text PRIMARY KEY NOT NULL, "senderAddress" text NOT NULL, "sent" integer NOT NULL, "content" text NOT NULL, "conversationId" text NOT NULL)`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_message" ("id" text PRIMARY KEY NOT NULL, "senderAddress" text NOT NULL, "sent" integer NOT NULL, "content" text NOT NULL, "conversationId" text NOT NULL, CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f" FOREIGN KEY ("conversationId") REFERENCES "conversation" ("topic") ON DELETE NO ACTION ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_message"("id", "senderAddress", "sent", "content", "conversationId") SELECT "id", "senderAddress", "sent", "content", "conversationId" FROM "message"`
    );
    await queryRunner.query(`DROP TABLE "message"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_message" RENAME TO "message"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message" RENAME TO "temporary_message"`
    );
    await queryRunner.query(
      `CREATE TABLE "message" ("id" text PRIMARY KEY NOT NULL, "senderAddress" text NOT NULL, "sent" integer NOT NULL, "content" text NOT NULL, "conversationId" text NOT NULL)`
    );
    await queryRunner.query(
      `INSERT INTO "message"("id", "senderAddress", "sent", "content", "conversationId") SELECT "id", "senderAddress", "sent", "content", "conversationId" FROM "temporary_message"`
    );
    await queryRunner.query(`DROP TABLE "temporary_message"`);
    await queryRunner.query(`DROP TABLE "message"`);
    await queryRunner.query(`DROP TABLE "conversation"`);
  }
}
