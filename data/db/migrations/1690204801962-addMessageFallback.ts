import { MigrationInterface, QueryRunner } from "typeorm";

export class addMessageFallback1690204801962 implements MigrationInterface {
  name = "addMessageFallback1690204801962";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message" ADD COLUMN "contentFallback" text`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contentFallback" DROP COLUMN "reactions"`
    );
  }
}
