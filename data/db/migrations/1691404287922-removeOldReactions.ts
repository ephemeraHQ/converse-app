import { MigrationInterface, QueryRunner } from "typeorm";

export class removeOldReactions1691404287922 implements MigrationInterface {
  name = "removeOldReactions1691404287922";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "reactions"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message" ADD COLUMN "reactions" text NOT NULL DEFAULT ('{}')`
    );
  }
}
