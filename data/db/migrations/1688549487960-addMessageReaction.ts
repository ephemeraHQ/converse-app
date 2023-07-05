import { MigrationInterface, QueryRunner } from "typeorm";

export class addMessageReaction1688549487960 implements MigrationInterface {
  name = "addMessageReaction1688549487960";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message" ADD COLUMN "reactions" text NOT NULL DEFAULT ('{}')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "reactions"`);
  }
}
