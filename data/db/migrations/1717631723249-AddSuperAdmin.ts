import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuperAdmin1717631723249 implements MigrationInterface {
    name = 'AddSuperAdmin1717631723249'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_e5dbc98150afc52f73695c7c8d"`);
        await queryRunner.query(`DROP INDEX "IDX_14fde3d0ed2191ef415d5f759d"`);
        await queryRunner.query(`DROP INDEX "IDX_7cf4a4df1f2627f72bf6231635"`);
        await queryRunner.query(`DROP INDEX "IDX_7f96058748fda6d300b9572c4f"`);
        await queryRunner.query(`CREATE TABLE "temporary_message" ("id" text PRIMARY KEY NOT NULL, "senderAddress" text NOT NULL, "sent" integer NOT NULL, "content" text NOT NULL, "conversationId" text NOT NULL, "status" text NOT NULL DEFAULT ('sent'), "contentType" text NOT NULL DEFAULT ('xmtp.org/text:1.0'), "contentFallback" text, "referencedMessageId" text, "converseMetadata" text)`);
        await queryRunner.query(`INSERT INTO "temporary_message"("id", "senderAddress", "sent", "content", "conversationId", "status", "contentType", "contentFallback", "referencedMessageId", "converseMetadata") SELECT "id", "senderAddress", "sent", "content", "conversationId", "status", "contentType", "contentFallback", "referencedMessageId", "converseMetadata" FROM "message"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`ALTER TABLE "temporary_message" RENAME TO "message"`);
        await queryRunner.query(`CREATE INDEX "IDX_e5dbc98150afc52f73695c7c8d" ON "message" ("sent") `);
        await queryRunner.query(`CREATE INDEX "IDX_14fde3d0ed2191ef415d5f759d" ON "message" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_7cf4a4df1f2627f72bf6231635" ON "message" ("conversationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7f96058748fda6d300b9572c4f" ON "message" ("referencedMessageId") `);
        await queryRunner.query(`DROP INDEX "IDX_b895a35679cdf0702fb2218718"`);
        await queryRunner.query(`DROP INDEX "IDX_134e668e0d62c7cd93624ea4d5"`);
        await queryRunner.query(`CREATE TABLE "temporary_conversation" ("topic" text PRIMARY KEY NOT NULL, "peerAddress" text, "createdAt" integer NOT NULL, "contextConversationId" text, "contextMetadata" text, "readUntil" integer NOT NULL DEFAULT (0), "pending" boolean NOT NULL DEFAULT (0), "version" text NOT NULL DEFAULT ('v2'), "spamScore" decimal(6,2), "isGroup" boolean NOT NULL DEFAULT (0), "groupMembers" text, "groupAdmins" text, "groupPermissionLevel" text, "lastNotificationsSubscribedPeriod" integer, "groupSuperAdmins" text, "groupName" text)`);
        await queryRunner.query(`INSERT INTO "temporary_conversation"("topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "readUntil", "pending", "version", "spamScore", "isGroup", "groupMembers", "groupAdmins", "groupPermissionLevel", "lastNotificationsSubscribedPeriod") SELECT "topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "readUntil", "pending", "version", "spamScore", "isGroup", "groupMembers", "groupAdmins", "groupPermissionLevel", "lastNotificationsSubscribedPeriod" FROM "conversation"`);
        await queryRunner.query(`DROP TABLE "conversation"`);
        await queryRunner.query(`ALTER TABLE "temporary_conversation" RENAME TO "conversation"`);
        await queryRunner.query(`CREATE INDEX "IDX_b895a35679cdf0702fb2218718" ON "conversation" ("peerAddress") `);
        await queryRunner.query(`CREATE INDEX "IDX_134e668e0d62c7cd93624ea4d5" ON "conversation" ("pending") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_134e668e0d62c7cd93624ea4d5"`);
        await queryRunner.query(`DROP INDEX "IDX_b895a35679cdf0702fb2218718"`);
        await queryRunner.query(`ALTER TABLE "conversation" RENAME TO "temporary_conversation"`);
        await queryRunner.query(`CREATE TABLE "conversation" ("topic" text PRIMARY KEY NOT NULL, "peerAddress" text, "createdAt" integer NOT NULL, "contextConversationId" text, "contextMetadata" text, "readUntil" integer NOT NULL DEFAULT (0), "pending" boolean NOT NULL DEFAULT (0), "version" text NOT NULL DEFAULT ('v2'), "spamScore" decimal(6,2), "isGroup" boolean NOT NULL DEFAULT (0), "groupMembers" text, "groupAdmins" text, "groupPermissionLevel" text, "lastNotificationsSubscribedPeriod" integer)`);
        await queryRunner.query(`INSERT INTO "conversation"("topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "readUntil", "pending", "version", "spamScore", "isGroup", "groupMembers", "groupAdmins", "groupPermissionLevel", "lastNotificationsSubscribedPeriod") SELECT "topic", "peerAddress", "createdAt", "contextConversationId", "contextMetadata", "readUntil", "pending", "version", "spamScore", "isGroup", "groupMembers", "groupAdmins", "groupPermissionLevel", "lastNotificationsSubscribedPeriod" FROM "temporary_conversation"`);
        await queryRunner.query(`DROP TABLE "temporary_conversation"`);
        await queryRunner.query(`CREATE INDEX "IDX_134e668e0d62c7cd93624ea4d5" ON "conversation" ("pending") `);
        await queryRunner.query(`CREATE INDEX "IDX_b895a35679cdf0702fb2218718" ON "conversation" ("peerAddress") `);
        await queryRunner.query(`DROP INDEX "IDX_7f96058748fda6d300b9572c4f"`);
        await queryRunner.query(`DROP INDEX "IDX_7cf4a4df1f2627f72bf6231635"`);
        await queryRunner.query(`DROP INDEX "IDX_14fde3d0ed2191ef415d5f759d"`);
        await queryRunner.query(`DROP INDEX "IDX_e5dbc98150afc52f73695c7c8d"`);
        await queryRunner.query(`ALTER TABLE "message" RENAME TO "temporary_message"`);
        await queryRunner.query(`CREATE TABLE "message" ("id" text PRIMARY KEY NOT NULL, "senderAddress" text NOT NULL, "sent" integer NOT NULL, "content" text NOT NULL, "conversationId" text NOT NULL, "status" text NOT NULL DEFAULT ('sent'), "sentViaConverse" boolean NOT NULL DEFAULT (0), "contentType" text NOT NULL DEFAULT ('xmtp.org/text:1.0'), "contentFallback" text, "referencedMessageId" text, "converseMetadata" text)`);
        await queryRunner.query(`INSERT INTO "message"("id", "senderAddress", "sent", "content", "conversationId", "status", "contentType", "contentFallback", "referencedMessageId", "converseMetadata") SELECT "id", "senderAddress", "sent", "content", "conversationId", "status", "contentType", "contentFallback", "referencedMessageId", "converseMetadata" FROM "temporary_message"`);
        await queryRunner.query(`DROP TABLE "temporary_message"`);
        await queryRunner.query(`CREATE INDEX "IDX_7f96058748fda6d300b9572c4f" ON "message" ("referencedMessageId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7cf4a4df1f2627f72bf6231635" ON "message" ("conversationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_14fde3d0ed2191ef415d5f759d" ON "message" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_e5dbc98150afc52f73695c7c8d" ON "message" ("sent") `);
    }

}
