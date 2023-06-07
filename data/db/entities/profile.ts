import { Entity, Column, PrimaryColumn } from "typeorm/browser";

import { sentryTrackMessage } from "../../../utils/sentry";

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
  ensNames?: EnsName[];
  farcasterUsernames?: string[];
  lensHandles?: LensHandle[];
};

@Entity()
export class Profile {
  // @ts-ignore
  public static name = "Profile";

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
      const data = { error, socials: this.socials };
      console.log(data);
      sentryTrackMessage("SOCIALS_PARSING_ERROR", data);
      return {};
    }
  }
}
