import {
  NavigationAction,
  RouteProp,
  useNavigation,
  useRoute as useRouteNavigation,
} from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useEffect } from "react"
import { NavigationParamList } from "@/navigation/navigation.types"

// Extend global namespace for type safety
declare global {
  namespace ReactNavigation {
    interface RootParamList extends NavigationParamList {}
  }
}

export function useRoute<ScreenName extends keyof NavigationParamList>(): RouteProp<
  NavigationParamList,
  ScreenName
> {
  return useRouteNavigation<RouteProp<NavigationParamList, ScreenName>>()
}

export function useRouteParams<
  ScreenName extends keyof NavigationParamList,
>(): NavigationParamList[ScreenName] {
  return useRoute<ScreenName>().params as NavigationParamList[ScreenName]
}

// Wrapper around useNavigation to add some useful hooks.
// Also, expo-router syntax is useRouter so if we want to migrate towards that later it's useful to call it useRouter now.
export function useRouter(args?: {
  onBeforeRemove?: (e: { data: { action: NavigationAction } }) => void
  onBlur?: () => void
  onFocus?: () => void
}) {
  const { onFocus, onBeforeRemove, onBlur } = args || {}

  const navigation = useNavigation<NativeStackNavigationProp<NavigationParamList>>()

  useEffect(() => {
    const focusListener = navigation.addListener("focus", () => {
      if (onFocus) {
        onFocus()
      }
    })

    return () => {
      focusListener()
    }
  }, [onFocus, navigation])

  useEffect(() => {
    const blurListener = navigation.addListener("blur", () => {
      if (onBlur) {
        onBlur()
      }
    })

    return () => {
      blurListener()
    }
  }, [onBlur, navigation])

  useEffect(() => {
    const beforeRemoveListener = navigation.addListener("beforeRemove", (e) => {
      if (onBeforeRemove) {
        onBeforeRemove(e)
      }
    })

    return () => {
      beforeRemoveListener()
    }
  }, [onBeforeRemove, navigation])

  return navigation
}
