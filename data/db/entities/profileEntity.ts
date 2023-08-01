import { Entity, Column, PrimaryColumn } from "typeorm/browser";

import { sentryTrackMessage } from "../../../utils/sentry";
import { ProfileSocials } from "../../store/profilesStore";

@Entity()
export class ProfileEntity {
  // @ts-ignore
  public static name = "Profile";

  @PrimaryColumn("text")
  address!: string;

  @Column("text", { default: "{}" })
  socials!: string;

  @Column("int", { default: 0 })
  updatedAt!: number;

  getSocials(): ProfileSocials {
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
