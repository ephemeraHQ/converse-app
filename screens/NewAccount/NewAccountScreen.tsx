import { memo } from "react";

import { PictoTitleSubtitle } from "../../components/PictoTitleSubtitle";
import { Screen } from "../../components/Screen/ScreenComp/Screen";
import TableView from "../../components/TableView/TableView";
import { TableViewEmoji } from "../../components/TableView/TableViewImage";
import { translate } from "../../i18n";
import { useRouter } from "../../navigation/use-navigation";
import { PictoSizes } from "../../styles/sizes";
import { spacing } from "../../theme";
import { isDesktop } from "../../utils/device";
import {
  InstalledWallets,
  PopularWallets,
  RightViewChevron,
  useInstalledWallets,
} from "../Onboarding/OnboardingGetStartedScreen";

export const NewAccountScreen = memo(function NewAccountScreen() {
  const router = useRouter();

  const { walletsInstalled } = useInstalledWallets();

  const hasInstalledWallets = walletsInstalled.list.length > 0;

  return (
    <Screen
      safeAreaEdges={["bottom"]}
      preset="scroll"
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
      }}
    >
      <PictoTitleSubtitle.Container
        style={{
          marginBottom: spacing.xl,
          marginTop: spacing.xl,
        }}
      >
        <PictoTitleSubtitle.Picto
          picto="message.circle.fill"
          size={PictoSizes.onboardingComponent}
        />
        <PictoTitleSubtitle.Title>
          {translate("walletSelector.title")}
        </PictoTitleSubtitle.Title>
        <PictoTitleSubtitle.Subtitle>
          {translate("walletSelector.subtitle")}
        </PictoTitleSubtitle.Subtitle>
      </PictoTitleSubtitle.Container>

      <TableView
        title={translate("walletSelector.converseAccount.title")}
        items={[
          {
            id: "phone",
            leftView: <TableViewEmoji emoji="📞" />,
            title: translate("walletSelector.converseAccount.connectViaPhone"),
            rightView: RightViewChevron(),
            action: () => {
              router.push("NewAccountPrivy");
            },
          },
          {
            id: "ephemeral",
            leftView: <TableViewEmoji emoji="☁️" />,
            title: translate("walletSelector.converseAccount.createEphemeral"),
            rightView: RightViewChevron(),
            action: () => {
              router.push("NewAccountEphemeralLogin");
            },
          },
        ]}
      />

      {hasInstalledWallets && !isDesktop && (
        <InstalledWallets wallets={walletsInstalled.list} />
      )}

      <TableView
        title={
          isDesktop
            ? translate("walletSelector.connectionOptions.title")
            : hasInstalledWallets
            ? translate("walletSelector.connectionOptions.otherOptions")
            : translate("walletSelector.connectionOptions.connectForDevs")
        }
        items={[
          {
            id: "privateKey",
            leftView: <TableViewEmoji emoji="🔑" />,
            title: translate("walletSelector.connectionOptions.connectViaKey"),
            rightView: RightViewChevron(),
            action: () => {
              router.push("NewAccountPrivateKey");
            },
          },
        ]}
      />

      {!hasInstalledWallets && !isDesktop && <PopularWallets />}
    </Screen>
  );
});
