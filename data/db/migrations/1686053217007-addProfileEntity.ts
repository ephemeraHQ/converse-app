import { MigrationInterface, QueryRunner } from "typeorm";

export class addProfileEntity1686053217007 implements MigrationInterface {
  name = "addProfileEntity1686053217007";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "profile" ("address" text PRIMARY KEY NOT NULL, "socials" text NOT NULL DEFAULT ('{}'), "updatedAt" integer NOT NULL DEFAULT (0))`
    );
    // Get all rows in the conversations table that have a non-null value in ensName

    const conversations = await queryRunner.query(
      `SELECT peerAddress, ensName FROM conversation WHERE ensName IS NOT NULL AND ensName != ""`
    );
    // Let's keep only one for each address
    const ensByAddress: { [address: string]: string } = {};
    conversations.forEach((c: any) => {
      ensByAddress[c.peerAddress] = c.ensName;
    });

    // Loop through all rows in the conversations table that have a non-null value in ensName
    for (const address in ensByAddress) {
      // Escape any backslashes, forward slashes, double quotes, curly braces {, and curly braces } in the ensName value
      const socials = {
        ensNames: [{ name: ensByAddress[address], primary: true }],
        lensHandles: [],
        farcasterUsernames: [],
      };

      // Insert a new row into the profile table with the peerAddress and socials values
      const profileRepository = queryRunner.manager.getRepository("Profile");
      await profileRepository.insert({
        address,
        socials: JSON.stringify(socials),
      });
    }
    await queryRunner.query(
      `CREATE INDEX "IDX_b895a35679cdf0702fb2218718" ON "conversation" ("peerAddress") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_b895a35679cdf0702fb2218718"`);
    await queryRunner.query(`DROP TABLE "profile"`);
  }
}
