import { Platform } from "react-native";
export default function formatProviderUrl(walletService) {
    const { mobile } = walletService;
    const { universal: universalLink, native: deepLink } = mobile;
    if (Platform.OS === "android") {
        return `${deepLink}`;
    }
    return `${universalLink || `${deepLink}/`}`;
}
