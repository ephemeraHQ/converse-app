import { Text } from "react-native";

import OnboardingComponent from "./OnboardingComponent";
import { useSettingsStore } from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { requestAddressBookPermissions } from "../../utils/addressBook";

export default function AddressBook() {
  const setSkipAddressBook = useSettingsStore((s) => s.setSkipAddressBook);
  const setAddressBookPermissionStatus = useAppStore(
    (s) => s.setAddressBookPermissionStatus
  );
  return (
    <OnboardingComponent
      title="Address book"
      picto="message.circle.fill"
      subtitle="Address book"
      primaryButtonText="Share"
      primaryButtonAction={async () => {
        // Open popup
        const newStatus = await requestAddressBookPermissions();
        if (!newStatus) return;
        setAddressBookPermissionStatus(newStatus);
      }}
      backButtonText="Skip"
      backButtonAction={() => {
        setSkipAddressBook(true);
      }}
    >
      <Text>Address book</Text>
    </OnboardingComponent>
  );
}
