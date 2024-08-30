import Avatar, { AvatarProps } from "@components/Avatar";
import { useProfileSocials } from "@hooks/useProfileSocials";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import { FC } from "react";

interface ConnectedAvatarProps
  extends Pick<
    AvatarProps,
    "size" | "style" | "color" | "showIndicator" | "invertColor"
  > {
  peerAddress: string;
}

export const ConnectedAvatar: FC<ConnectedAvatarProps> = ({
  peerAddress,
  ...avatarProps
}) => {
  const { data } = useProfileSocials(peerAddress);

  const preferredAvatar = data ? getPreferredAvatar(data) : undefined;
  const preferredName = data ? getPreferredName(data, peerAddress) : undefined;
  return <Avatar uri={preferredAvatar} name={preferredName} {...avatarProps} />;
};
