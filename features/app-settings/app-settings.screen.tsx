import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { Button } from "@/design-system/Button/Button";
import { ITextProps, Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { translate } from "@/i18n";
import { useHeader } from "@/navigation/use-header";
import { useRouter } from "@/navigation/useNavigation";
import { useAppTheme } from "@/theme/useAppTheme";
import { getEnv } from "@/utils/getEnv";
import * as Updates from "expo-updates";
import { memo } from "react";

export const AppSettingsScreen = memo(function AppSettingsScreen() {
  const { theme } = useAppTheme();

  const router = useRouter();

  useHeader({
    safeAreaEdges: ["top"],
    title: translate("app_settings"),
    onBack: () => router.goBack(),
  });

  return (
    <Screen
      contentContainerStyle={{
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing.md,
        rowGap: theme.spacing.xl,
      }}
    >
      <Section title="General">
        <DebugText>Env: {getEnv()}</DebugText>
      </Section>

      <Section title="Expo Updates">
        <ExpoUpdates />
      </Section>
    </Screen>
  );
});

const Section = memo(function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { theme } = useAppTheme();

  return (
    <VStack>
      <Text
        preset="bigBold"
        style={{
          textAlign: "center",
          marginBottom: theme.spacing.xxs,
        }}
      >
        {title}
      </Text>
      {children}
    </VStack>
  );
});

const DebugText = memo(function DebugText({
  children,
  ...textProps
}: ITextProps) {
  return (
    <Text
      style={{
        textAlign: "center",
      }}
      {...textProps}
    >
      {children}
    </Text>
  );
});

const ExpoUpdates = memo(function ExpoUpdates() {
  const {
    currentlyRunning,
    isUpdateAvailable,
    downloadedUpdate,
    isDownloading,
    isChecking,
  } = Updates.useUpdates();

  // Handle reload when update is available
  const handleReload = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error("Failed to reload:", error);
    }
  };

  return (
    <VStack>
      {/* Current Update Info */}
      <DebugText>
        Update ID: {currentlyRunning.updateId || "embedded"}
      </DebugText>
      <DebugText>
        Created At: {currentlyRunning.createdAt?.toLocaleString() || "N/A"}
      </DebugText>
      <DebugText>
        Is Embedded: {String(currentlyRunning.isEmbeddedLaunch)}
      </DebugText>
      <DebugText>Runtime Version: {currentlyRunning.runtimeVersion}</DebugText>
      <DebugText>Channel: {currentlyRunning.channel || "N/A"}</DebugText>
      <DebugText>
        Emergency Launch: {String(currentlyRunning.isEmergencyLaunch)}
      </DebugText>
      {currentlyRunning.emergencyLaunchReason && (
        <DebugText>
          Emergency Reason: {currentlyRunning.emergencyLaunchReason}
        </DebugText>
      )}
      {currentlyRunning.launchDuration && (
        <DebugText>
          Launch Duration: {currentlyRunning.launchDuration}ms
        </DebugText>
      )}

      {/* Update Status */}
      {isChecking && <DebugText>Checking for updates...</DebugText>}
      {isDownloading && <DebugText>Downloading update...</DebugText>}

      {/* Downloaded Update Info */}
      {downloadedUpdate && (
        <>
          <DebugText>New Update Available:</DebugText>
          <DebugText>ID: {downloadedUpdate.updateId}</DebugText>
          <DebugText>
            Created: {downloadedUpdate.createdAt.toLocaleString()}
          </DebugText>
        </>
      )}

      {/* Reload Button */}
      {isUpdateAvailable && downloadedUpdate && (
        <Button onPress={handleReload}>Reload App to Apply Update</Button>
      )}
    </VStack>
  );
});
