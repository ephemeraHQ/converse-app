import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedCenter } from "@/design-system/Center";
import { Icon } from "@/design-system/Icon/Icon";
import { Pressable } from "@/design-system/Pressable";
import { AnimatedText } from "@/design-system/Text";
import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { PressableScale } from "@/design-system/pressable-scale";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitlte";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { useAppTheme } from "@/theme/useAppTheme";
import { getRandomId } from "@/utils/general";
import { memo } from "react";
import { FadeIn, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const OnboardingGetStartedScreen = memo(
  function OnboardingGetStartedScreen() {
    const { theme } = useAppTheme();
    const insets = useSafeAreaInsets();

    return (
      <Screen
        key={getRandomId()}
        contentContainerStyle={{
          flex: 1,
        }}
      >
        <VStack
          //   {...debugBorder()}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <VStack
            // {...debugBorder()}
            style={{
              rowGap: theme.spacing.xs,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: theme.spacing.lg,
            }}
          >
            <OnboardingSubtitle
              entering={
                FadeInUp.springify().delay(200).duration(3000)
                // .stiffness(theme.animation.spring.stiffness)
                // .damping(theme.animation.spring.damping)
              }
            >
              Welcome to Convos
            </OnboardingSubtitle>
            <OnboardingTitle
              entering={FadeInUp.springify().delay(250).duration(3000)}
            >
              Become unspammable
            </OnboardingTitle>
          </VStack>
          <AnimatedCenter
            style={{
              marginTop: theme.spacing.sm,
              flexDirection: "row",
              columnGap: theme.spacing.xxs,
            }}
          >
            <AnimatedText
              size="xs"
              color="secondary"
              entering={FadeIn.springify().delay(400).duration(3000)}
            >
              Simple
            </AnimatedText>
            <AnimatedText size="xs" color="secondary">
              ⋅
            </AnimatedText>
            <AnimatedText
              size="xs"
              color="secondary"
              entering={FadeIn.springify().delay(450).duration(3000)}
            >
              Secure
            </AnimatedText>
            <AnimatedText size="xs" color="secondary">
              ⋅
            </AnimatedText>
            <AnimatedText
              size="xs"
              color="secondary"
              entering={FadeIn.springify().delay(500).duration(3000)}
            >
              Universal
            </AnimatedText>
          </AnimatedCenter>
        </VStack>

        <Pressable>
          <AnimatedVStack
            entering={FadeIn.springify().delay(600).duration(3000)}
            style={{
              paddingBottom: insets.bottom + theme.spacing.sm,
              justifyContent: "center",
              alignItems: "center",
              rowGap: theme.spacing.xxs,
            }}
          >
            <PressableScale>
              <AnimatedCenter
                style={{
                  borderRadius: 999,
                  width: theme.avatarSize.lg,
                  height: theme.avatarSize.lg,
                  backgroundColor: theme.colors.fill.primary,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Icon
                  style={{
                    color: "#A1F293",
                  }}
                  icon="checkmark"
                  size={40}
                />
              </AnimatedCenter>
            </PressableScale>
            <AnimatedText size="xs">Create a Contact Card</AnimatedText>
          </AnimatedVStack>
        </Pressable>
      </Screen>
    );
  }
);
