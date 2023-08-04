import { MigrationInterface, QueryRunner } from "typeorm";

export class addIndexToPendingConversation1691154310694
  implements MigrationInterface
{
  name = "addIndexToPendingConversation1691154310694";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_134e668e0d62c7cd93624ea4d5" ON "conversation" ("pending") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_134e668e0d62c7cd93624ea4d5"`);
  }
}
