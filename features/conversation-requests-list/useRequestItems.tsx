import { useV3RequestItems } from "./useV3RequestItems";

export const useRequestItems = () => {
  const { likelyNotSpam, likelySpam } = useV3RequestItems();

  return {
    likelyNotSpam,
    likelySpam,
  };
};
