import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastNotifSubscribePeriodToConversation1709893391562
  implements MigrationInterface
{
  name = "AddLastNotifSubscribePeriodToConversation1709893391562";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD "lastNotificationsSubscribedPeriod" integer`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP COLUMN "lastNotificationsSubscribedPeriod"`
    );
  }
}
