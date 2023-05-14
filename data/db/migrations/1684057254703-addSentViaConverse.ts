import { MigrationInterface, QueryRunner } from "typeorm";

export class addSentViaConverse1684057254703 implements MigrationInterface {
  name = "addSentViaConverse1684057254703";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message" ADD COLUMN "sentViaConverse" boolean NOT NULL DEFAULT (0)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message" DROP COLUMN "sentViaConverse"`
    );
  }
}
