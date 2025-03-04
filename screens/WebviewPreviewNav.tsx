import { AppNativeStack } from "@/navigation/app-navigator"
import { WebviewPreview } from "@/screens/WebviewPreview"

export type WebviewPreviewNavParams = {
  uri: string
}

export const WebviewPreviewScreenConfig = {
  path: "/webviewPreview",
  parse: {
    uri: decodeURIComponent,
  },
  stringify: {
    uri: encodeURIComponent,
  },
}

export function WebviewPreviewNav() {
  return (
    <AppNativeStack.Screen
      name="WebviewPreview"
      component={WebviewPreview}
      options={{
        presentation: "modal",
      }}
    />
  )
}
