import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsActive1721143963530 implements MigrationInterface {
  name = "AddIsActive1721143963530";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_134e668e0d62c7cd93624ea4d5"`);
    await queryRunner.query(`DROP INDEX "IDX_b895a35679cdf0702fb2218718"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_conversation" ("topic" text PRIMARY KEY NOT NULL, "peerAddress" text, "createdAt" integer NOT NULL, "contextConversationId" text, "contextMetadata" text, "readUntil" integer NOT NULL DEFAULT (0), "pending" boolean NOT NULL DEFAULT (0), "version" text NOT NULL DEFAULT ('v2'), "spamScore" decimal(6,2), "isGroup" boolean NOT NULL DEFAULT (0), "groupMembers" text, "groupAdmins" text, "groupPermissionLevel" text, "lastNotificationsSubscribedPeriod" integer, "groupSuperAdmins" text, "groupName" text, "isActive" boolean)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_conversation"("topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "readUntil", "pending", "version", "spamScore", "isGroup", "groupMembers", "groupAdmins", "groupPermissionLevel", "lastNotificationsSubscribedPeriod", "groupSuperAdmins", "groupName") SELECT "topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "readUntil", "pending", "version", "spamScore", "isGroup", "groupMembers", "groupAdmins", "groupPermissionLevel", "lastNotificationsSubscribedPeriod", "groupSuperAdmins", "groupName" FROM "conversation"`
    );
    await queryRunner.query(`DROP TABLE "conversation"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_conversation" RENAME TO "conversation"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_134e668e0d62c7cd93624ea4d5" ON "conversation" ("pending") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b895a35679cdf0702fb2218718" ON "conversation" ("peerAddress") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_b895a35679cdf0702fb2218718"`);
    await queryRunner.query(`DROP INDEX "IDX_134e668e0d62c7cd93624ea4d5"`);
    await queryRunner.query(
      `ALTER TABLE "conversation" RENAME TO "temporary_conversation"`
    );
    await queryRunner.query(
      `CREATE TABLE "conversation" ("topic" text PRIMARY KEY NOT NULL, "peerAddress" text, "createdAt" integer NOT NULL, "contextConversationId" text, "contextMetadata" text, "readUntil" integer NOT NULL DEFAULT (0), "pending" boolean NOT NULL DEFAULT (0), "version" text NOT NULL DEFAULT ('v2'), "spamScore" decimal(6,2), "isGroup" boolean NOT NULL DEFAULT (0), "groupMembers" text, "groupAdmins" text, "groupPermissionLevel" text, "lastNotificationsSubscribedPeriod" integer, "groupSuperAdmins" text, "groupName" text)`
    );
    await queryRunner.query(
      `INSERT INTO "conversation"("topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "readUntil", "pending", "version", "spamScore", "isGroup", "groupMembers", "groupAdmins", "groupPermissionLevel", "lastNotificationsSubscribedPeriod", "groupSuperAdmins", "groupName") SELECT "topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "readUntil", "pending", "version", "spamScore", "isGroup", "groupMembers", "groupAdmins", "groupPermissionLevel", "lastNotificationsSubscribedPeriod", "groupSuperAdmins", "groupName" FROM "temporary_conversation"`
    );
    await queryRunner.query(`DROP TABLE "temporary_conversation"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_b895a35679cdf0702fb2218718" ON "conversation" ("peerAddress") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_134e668e0d62c7cd93624ea4d5" ON "conversation" ("pending") `
    );
  }
}
