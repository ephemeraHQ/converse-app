import { memo } from "react";

import { NewAccountScreenComp } from "../../components/NewAccount/NewAccountScreenComp";
import { NewAccountPictoTitleSubtitle } from "../../components/NewAccount/NewAccountTitleSubtitlePicto";
import TableView from "../../components/TableView/TableView";
import { TableViewEmoji } from "../../components/TableView/TableViewImage";
import { translate } from "../../i18n";
import { useRouter } from "../../navigation/useNavigation";
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
    <NewAccountScreenComp
      safeAreaEdges={["bottom"]}
      preset="scroll"
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
      }}
    >
      <NewAccountPictoTitleSubtitle.Container>
        <NewAccountPictoTitleSubtitle.Picto picto="message.circle.fill" />
        <NewAccountPictoTitleSubtitle.Title>
          {translate("walletSelector.title")}
        </NewAccountPictoTitleSubtitle.Title>
      </NewAccountPictoTitleSubtitle.Container>

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
              router.push("NewAccountEphemera");
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
    </NewAccountScreenComp>
  );
});
