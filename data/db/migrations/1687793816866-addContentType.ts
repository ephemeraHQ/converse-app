import { MigrationInterface, QueryRunner } from "typeorm";

export class addContentType1687793816866 implements MigrationInterface {
  name = "addContentType1687793816866";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message" ADD COLUMN "contentType" text NOT NULL DEFAULT ('xmtp.org/text:1.0')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "contentType"`);
  }
}
