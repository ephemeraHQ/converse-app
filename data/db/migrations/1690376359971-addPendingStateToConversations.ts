import { MigrationInterface, QueryRunner } from "typeorm";

export class addPendingStateToConversations1690376359971
  implements MigrationInterface
{
  name = "addPendingStateToConversations1690376359971";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD COLUMN "pending" boolean NOT NULL DEFAULT (0)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "conversation" DROP COLUMN "pending"`);
  }
}
