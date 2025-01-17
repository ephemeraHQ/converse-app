export type ProfileType = {
  avatar?: string;
  username: string;
  displayName?: string;
};

type CreateOrUpdateProfileError = {
  success: false;
  errorMessage: string;
};

type CreateOrUpdateProfileSuccess = {
  success: true;
};

export type CreateOrUpdateProfileResponse =
  | CreateOrUpdateProfileError
  | CreateOrUpdateProfileSuccess;
