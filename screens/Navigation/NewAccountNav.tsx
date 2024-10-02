import { memo } from "react";

import { NativeStack } from "./Navigation";
import { PictoTitleSubtitle } from "../../components/PictoTitleSubtitle";
import { Screen } from "../../components/Screen";
import TableView from "../../components/TableView/TableView";
import { TableViewEmoji } from "../../components/TableView/TableViewImage";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { translate } from "../../i18n";
import { useAuthNavigation } from "../../navigation/use-navigation";
import { PictoSizes } from "../../styles/sizes";
import { spacing } from "../../theme";
import { isDesktop } from "../../utils/device";
import {
  BasicMethods,
  InstalledWallets,
  PopularWallets,
  RightViewChevron,
  useInstalledWallets,
} from "../Onboarding/GetStartedScreen";

export function NewAccountNav() {
  return (
    <NativeStack.Screen
      name="NewAccount"
      component={NewAccountScreen}
      options={{
        presentation: "modal",
        headerShown: false,
      }}
    />
  );
}

const NewAccountScreen = memo(function NewAccountScreen() {
  const router = useAuthNavigation();

  const { setConnectionMethod } = useOnboardingStore(
    useSelect(["setConnectionMethod"])
  );

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
              setConnectionMethod("phone");
              router.push("PrivyConnect");
            },
          },
          {
            id: "ephemeral",
            leftView: <TableViewEmoji emoji="☁️" />,
            title: translate("walletSelector.converseAccount.createEphemeral"),
            rightView: RightViewChevron(),
            action: () => {
              setConnectionMethod("ephemeral");
              router.push("EphemeralLogin");
            },
          },
        ]}
      />

      {hasInstalledWallets && !isDesktop && (
        <InstalledWallets wallets={walletsInstalled.list} />
      )}

      <BasicMethods hasInstalledWallets={hasInstalledWallets} />

      {!hasInstalledWallets && !isDesktop && <PopularWallets />}
    </Screen>
  );
});
