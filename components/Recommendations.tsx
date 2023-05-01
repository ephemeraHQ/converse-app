import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { Frens, findFrens } from "../utils/api";
import mmkv from "../utils/mmkv";

const EXPIRE_AFTER = 86400000; // 1 DAY

export default function Recommendations() {
  const [fetching, setFetching] = useState(false);
  const [frens, setFrens] = useState<Frens | undefined>(undefined);

  useEffect(() => {
    // On load, let's load frens
    const getRecommendations = async () => {
      const now = new Date().getTime();
      const existingRecommendations = mmkv.getString(
        "converse-recommendations"
      );
      if (existingRecommendations) {
        try {
          const parsedRecommendations = JSON.parse(existingRecommendations);
          if (now - parsedRecommendations.fetchedAt < EXPIRE_AFTER) {
            setFrens(parsedRecommendations.frens);
            return;
          }
        } catch (e) {
          console.log(e);
        }
      }
      setFetching(true);
      const frens = await findFrens();
      mmkv.set(
        "converse-recommendations",
        JSON.stringify({
          fetchedAt: new Date().getTime(),
          frens,
        })
      );
      setFrens(frens);
      setFetching(false);
    };
    getRecommendations();
  }, []);
  console.log("frens are", frens, "loading", fetching ? "yes" : "no");
  return (
    <View>
      <Text>Coucou</Text>
    </View>
  );
}
