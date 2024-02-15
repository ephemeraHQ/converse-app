import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGroupConversations1708001080389 implements MigrationInterface {
  name = "AddGroupConversations1708001080389";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation" ALTER COLUMN "peerAddress" DROP NOT NULL;`
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD "isGroup" boolean NOT NULL DEFAULT (0)`
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD "groupMembers" text`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Can't undo DROP NOT NULL
    await queryRunner.query(`ALTER TABLE "conversation" DROP COLUMN "isGroup"`);
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP COLUMN "groupMembers"`
    );
  }
}
