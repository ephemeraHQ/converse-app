import { MigrationInterface, QueryRunner } from "typeorm";

export class addLensHandle1671788934503 implements MigrationInterface {
  name = "addLensHandle1671788934503";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD COLUMN "lensHandle" text DEFAULT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP COLUMN "lensHandle"`
    );
  }
}
