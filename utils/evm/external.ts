import { useCallback } from "react";

// @todo => implement to be able to trigger tx from
// external wallet i.e. not privy
export const useExternalProvider = () => {
  const getExternalProvider = useCallback(() => {
    return undefined;
  }, []);
  return { getExternalProvider };
};
