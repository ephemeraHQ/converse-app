import { Entity, Column, PrimaryColumn } from "typeorm";

export type LensHandle = {
  profileId: string;
  handle: string;
  isDefault: boolean;
};

export type EnsName = {
  name: string;
  isPrimary: boolean;
};

type Socials = {
  ensName?: EnsName[];
  farcasterUsernames?: string[];
  lensHandles?: LensHandle[];
};

@Entity()
export class Profile {
  @PrimaryColumn("text")
  address!: string;

  @Column("text", { default: "{}" })
  socials!: string;

  @Column("int", { default: 0 })
  updatedAt!: number;

  getSocials(): Socials {
    try {
      const parsed = JSON.parse(this.socials);
      return parsed;
    } catch (error) {
      return {};
    }
  }
}
