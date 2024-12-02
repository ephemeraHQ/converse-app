import { useIsSharingMode } from "./useIsSharingMode";

export const useShouldShowRequestsButton = () => {
  const sharingMode = useIsSharingMode();
};
