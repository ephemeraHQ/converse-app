import { ProfileSocials } from "../db/entities/profile";
import { ActionMap } from "./types";

// Product

export type ProfilesType = { [address: string]: { socials: ProfileSocials } };

export const profilesInitialState: ProfilesType = {};

export enum ProfilesDispatchTypes {
  SetProfiles = "SET_PROFILES",
}

type ProfilesPayload = {
  [ProfilesDispatchTypes.SetProfiles]: {
    profiles: { [address: string]: { socials: ProfileSocials } };
  };
};

export type ProfilesActions =
  ActionMap<ProfilesPayload>[keyof ActionMap<ProfilesPayload>];

export const profilesReducer = (
  state: ProfilesType,
  action: ProfilesActions
): ProfilesType => {
  switch (action.type) {
    case ProfilesDispatchTypes.SetProfiles: {
      return {
        ...state,
        ...action.payload.profiles,
      };
    }

    default:
      return state;
  }
};
