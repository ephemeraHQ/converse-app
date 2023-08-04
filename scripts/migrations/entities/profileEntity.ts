import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class Profile {
  @PrimaryColumn("text")
  address!: string;

  @Column("text", { default: "{}" })
  socials!: string;

  @Column("int", { default: 0 })
  updatedAt!: number;
}
