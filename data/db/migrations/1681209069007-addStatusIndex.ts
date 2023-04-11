import { MigrationInterface, QueryRunner } from "typeorm";

export class addStatusIndex1681209069007 implements MigrationInterface {
  name = "addStatusIndex1681209069007";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_14fde3d0ed2191ef415d5f759d" ON "message" ("status") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_14fde3d0ed2191ef415d5f759d"`);
  }
}
