import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveProfile1726828413530 implements MigrationInterface {
  name = "RemoveProfile1726828413530";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "profile"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "profile" ("address" text PRIMARY KEY NOT NULL, "socials" text NOT NULL DEFAULT ('{}'), "updatedAt" integer NOT NULL DEFAULT (0))`
    );
  }
}
