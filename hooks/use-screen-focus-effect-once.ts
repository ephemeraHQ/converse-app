import { useNavigation } from "@react-navigation/native"
import { useEffect } from "react"

export const useScreenFocusEffectOnce = (callback: () => void | Promise<void>) => {
  const navigation = useNavigation()
  // useFocusEffect will run the callback on mount as well
  // Calling Refectch will bypass the query cache
  // So when refetching on mount it will run as many times as it is mounted and bypass any function deduping
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      callback()
      // Feels weird to only want to run this once?
      // unsubscribe();
    })

    // Return the function to unsubscribe from the event so it gets removed on unmount
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
