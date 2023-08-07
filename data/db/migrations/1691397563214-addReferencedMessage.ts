import { MigrationInterface, QueryRunner } from "typeorm";

export class addReferencedMessage1691397563214 implements MigrationInterface {
  name = "addReferencedMessage1691397563214";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message" ADD COLUMN "referencedMessageId" text`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f96058748fda6d300b9572c4f" ON "message" ("referencedMessageId") `
    );
    const reactionsMessages = await queryRunner.query(
      `SELECT * FROM message WHERE contentType = "xmtp.org/reaction:1.0"; `
    );
    for (const reactionMessage of reactionsMessages) {
      try {
        const content = JSON.parse(reactionMessage.content);
        const reference = content.reference;
        await queryRunner.query(
          `UPDATE message SET referencedMessageId = :reference WHERE id = :id`,
          [reference, reactionMessage.id]
        );
      } catch (e) {
        console.log(e);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_7f96058748fda6d300b9572c4f"`);
    await queryRunner.query(
      `ALTER TABLE "message" DROP COLUMN "referencedMessageId"`
    );
  }
}
