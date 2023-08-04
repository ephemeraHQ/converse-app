import { profileRepository } from "../../db";
import { ProfileSocials } from "../../store/profilesStore";

export const loadProfilesByAddress = async () => {
  const profiles = await profileRepository.find();
  const profileByAddress: {
    [address: string]: { socials: ProfileSocials; updatedAt: number };
  } = {};
  profiles.forEach(
    (p) =>
      (profileByAddress[p.address] = {
        socials: p.getSocials(),
        updatedAt: p.updatedAt,
      })
  );
  return profileByAddress;
};

export const loadProfileByAddress = async (address: string) =>
  profileRepository.findOne({ where: { address } });
