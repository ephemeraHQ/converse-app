import { MigrationInterface, QueryRunner } from "typeorm";

export class addEnsName1673277126468 implements MigrationInterface {
  name = "addEnsName1673277126468";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD COLUMN "ensName" text DEFAULT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD COLUMN "handlesUpdatedAt" integer`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP COLUMN "handlesUpdatedAt"`
    );
    await queryRunner.query(`ALTER TABLE "conversation" DROP COLUMN "ensName"`);
  }
}
