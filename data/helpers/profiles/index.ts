import { sentryTrackMessage } from "../../../utils/sentry";
import { profileRepository } from "../../db";
import { Profile } from "../../db/entities/profileEntity";
import { ProfileSocials } from "../../store/profilesStore";

export const loadProfilesByAddress = async () => {
  const profiles = await profileRepository.find();
  const profileByAddress: {
    [address: string]: { socials: ProfileSocials; updatedAt: number };
  } = {};
  profiles.forEach(
    (p) =>
      (profileByAddress[p.address] = {
        socials: getSocials(p),
        updatedAt: p.updatedAt,
      })
  );
  return profileByAddress;
};

const getSocials = (profileEntity: Profile): ProfileSocials => {
  try {
    const parsed = JSON.parse(profileEntity.socials);
    return parsed;
  } catch (error) {
    const data = { error, socials: profileEntity.socials };
    console.log(data);
    sentryTrackMessage("SOCIALS_PARSING_ERROR", data);
    return {};
  }
};
