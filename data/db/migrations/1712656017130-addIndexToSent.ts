import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexToSent1712656017130 implements MigrationInterface {
  name = "AddIndexToSent1712656017130";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_e5dbc98150afc52f73695c7c8d" ON "message" ("sent") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_e5dbc98150afc52f73695c7c8d"`);
  }
}
