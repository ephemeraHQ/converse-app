import { ISocialProfileType } from "@/features/social-profiles/social-profiles.api"

export const supportedSocialProfiles: {
  type: ISocialProfileType
  imageLocalUri: number
}[] = [
  {
    type: "ens",
    imageLocalUri: require("@assets/images/web3/ens.png"),
  },
  {
    type: "farcaster",
    imageLocalUri: require("@assets/images/web3/farcaster.png"),
  },
  {
    type: "lens",
    imageLocalUri: require("@assets/images/web3/lens.png"),
  },
  {
    type: "unstoppable-domains",
    imageLocalUri: require("@assets/images/web3/unstoppable-domains.png"),
  },
  {
    type: "basename",
    imageLocalUri: require("@assets/images/web3/base.png"),
  },
]
