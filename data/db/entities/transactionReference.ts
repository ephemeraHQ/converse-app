import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class TransactionReference {
  // @ts-ignore
  public static name = "TransactionReference";

  @PrimaryColumn("text")
  id!: string;

  @Column("text", { default: "pending" })
  contentType!:
    | "transactionReference"
    | "coinbaseRegular"
    | "coinbaseSponsored";

  @Column("int")
  createdAt!: number;

  @Column("int")
  updatedAt!: number;

  @Column("text", { nullable: true })
  namespace?: string;

  @Column("text")
  networkId!: string;

  @Column("text")
  reference!: string;

  @Column("text", { default: "{}" })
  metadata?: string;

  @Column("text", { default: "pending" })
  status!: "PENDING" | "FAILURE" | "SUCCESS";

  @Column("boolean", { default: false })
  sponsored!: boolean;

  @Column("text", { nullable: true })
  blockExplorerURL?: string;

  // fields to add?
  // - events
  // - coinbase specific data as {}
}
