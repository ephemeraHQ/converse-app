import { MigrationInterface, QueryRunner } from "typeorm";

export class addReadStatus1683114681319 implements MigrationInterface {
  name = "addReadStatus1683114681319";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD COLUMN "readUntil" integer NOT NULL DEFAULT 0`
    );
    await queryRunner.query(
      `UPDATE "conversation" SET "readUntil" = (SELECT COALESCE(MAX(sent), 0) FROM "message" WHERE "message"."conversationId" = "conversation"."topic")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP COLUMN "readUntil"`
    );
  }
}
