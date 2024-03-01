import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConverseMessageMetadata1709030178271
  implements MigrationInterface
{
  name = "AddConverseMessageMetadata1709030178271";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message" ADD "converseMetadata" text`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message" DROP COLUMN "converseMetadata"`
    );
  }
}
