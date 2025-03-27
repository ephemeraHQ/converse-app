import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useEffect, useState } from "react"
import { WebView } from "react-native-webview"
import { NavigationParamList } from "@/navigation/navigation.types"

export function WebviewPreview({
  route,
}: NativeStackScreenProps<NavigationParamList, "WebviewPreview">) {
  // This is a trick because on Android, the setAllowFileAccess method
  // was called AFTER the setAllowFileAccess method and first file
  // uri could not be loaded. That way we start with a blank screen and
  // immediatly after we load our local URI
  const [uri, setUri] = useState("")
  useEffect(() => {
    setImmediate(() => {
      setUri(route.params.uri)
    })
  }, [route.params.uri])

  return (
    <WebView
      autoManageStatusBarEnabled={false}
      source={{
        uri,
      }}
      javaScriptEnabled
      originWhitelist={["*"]}
      allowFileAccess
      androidLayerType="hardware"
    />
  )
}
