import { memo, useMemo } from "react"
import { Screen } from "@/components/screen/screen"
import { HStack } from "@/design-system/HStack"
import { SettingsList } from "@/design-system/settings-list/settings-list"
import { ISettingsListRow } from "@/design-system/settings-list/settings-list.types"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { translate } from "@/i18n"
import { useHeader } from "@/navigation/use-header"
import { useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"
import { getEnv } from "@/utils/getEnv"
import { OtaUpdatesList } from "./components/ota-updates-list"

export const AppSettingsScreen = memo(function AppSettingsScreen() {
  const { theme } = useAppTheme()
  const router = useRouter()

  useHeader({
    safeAreaEdges: ["top"],
    title: translate("app_settings"),
    onBack: () => router.goBack(),
  })

  const generalSettings = useMemo((): ISettingsListRow[] => {
    return [{ label: "Environment", value: getEnv() }].filter(Boolean)
  }, [])

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      <HStack
        style={{
          padding: theme.spacing.md,
          backgroundColor: theme.colors.background.sunken,
          borderRadius: theme.borderRadius.sm,
          marginBottom: theme.spacing.xxxs,
        }}
      >
        <Text preset="formLabel" color="secondary">
          These settings are only available for development and debugging purposes
        </Text>
      </HStack>

      <VStack
        style={{
          rowGap: theme.spacing["3xl"],
        }}
      >
        <SettingsList rows={generalSettings} />
        <OtaUpdatesList />
      </VStack>
    </Screen>
  )
})
