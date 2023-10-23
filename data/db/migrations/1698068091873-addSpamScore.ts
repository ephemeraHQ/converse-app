import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSpamScore1698068091873 implements MigrationInterface {
  name = "AddSpamScore1698068091873";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD "spamScore" decimal(6,2) NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP COLUMN "spamScore"`
    );
  }
}
