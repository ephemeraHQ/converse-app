import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVersionToConversation1695029413899
  implements MigrationInterface
{
  name = "AddVersionToConversation1695029413899";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD COLUMN "version" text NOT NULL DEFAULT ('v2')`
    );
    await queryRunner.query(
      `UPDATE "conversation" SET "version" = 'v1' WHERE topic LIKE '/xmtp/0/dm-%';`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "conversation" DROP COLUMN "version"`);
  }
}
