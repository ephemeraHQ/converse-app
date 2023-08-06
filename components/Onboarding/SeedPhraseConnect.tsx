import { Wallet } from "ethers";
import * as Linking from "expo-linking";
import { useRef } from "react";
import {
  View,
  TextInput,
  useColorScheme,
  StyleSheet,
  Text,
  Platform,
  Alert,
} from "react-native";

import {
  textInputStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { getPrivateKeyFromMnemonic, validateMnemonic } from "../../utils/eth";

type Props = {
  seedPhrase: string;
  setSeedPhrase: (s: string) => void;
  setKeyboardVerticalOffset: (offset: number) => void;
  generateWallet: () => void;
};

export const getSignerFromSeedPhrase = async (mnemonic: string) => {
  let rightMnemonic = mnemonic;
  try {
    rightMnemonic = validateMnemonic(mnemonic);
  } catch (e) {
    console.log(e);
    Alert.alert("This seed phrase is invalid. Please try again");
    return;
  }
  try {
    const privateKey = await getPrivateKeyFromMnemonic(rightMnemonic);
    const signer = new Wallet(privateKey);
    return signer;
  } catch (e) {
    console.log(e);
    Alert.alert("This seed phrase is invalid. Please try again");
  }
};

export default function SeedPhraseConnect({
  seedPhrase,
  setSeedPhrase,
  setKeyboardVerticalOffset,
  generateWallet,
}: Props) {
  const colorScheme = useColorScheme();
  const textInputRef = useRef<TextInput | null>(null);
  const styles = useStyles();

  return (
    <>
      <View style={styles.seedPhraseContainer}>
        <TextInput
          multiline
          textAlignVertical="top"
          style={[
            textInputStyle(colorScheme),
            { width: "100%", height: "100%" },
          ]}
          placeholder="Enter your seed phrase"
          placeholderTextColor={textSecondaryColor(colorScheme)}
          onChangeText={(content) => {
            setSeedPhrase(content.replace(/\n/g, " "));
          }}
          onFocus={() => {
            setSeedPhrase(seedPhrase.trim());
          }}
          value={seedPhrase}
          ref={(r) => {
            textInputRef.current = r;
            r?.measure((x, y, width, height, pageX, pageY) => {
              setKeyboardVerticalOffset(-y - height - 80);
            });
          }}
          onKeyPress={(e) => {
            if (e.nativeEvent.key === "Enter") {
              textInputRef.current?.blur();
            }
          }}
        />
      </View>
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.links}>
          By signing in you agree to our{" "}
          <Text
            style={styles.link}
            onPress={() =>
              Linking.openURL(
                "https://converseapp.notion.site/Terms-and-conditions-004036ad55044aba888cc83e21b8cbdb"
              )
            }
          >
            terms and conditions.
          </Text>
        </Text>
        <Text style={styles.links}>
          <Text style={styles.link} onPress={generateWallet}>
            Try the app with an ephemeral wallet.
          </Text>
        </Text>
      </View>
    </>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    seedPhraseContainer: {
      width: "100%",
      paddingRight: 25,
      paddingLeft: 25,
      height: 130,
      marginTop: 38,
    },
    links: {
      textAlign: "center",
      marginLeft: 32,
      marginRight: 32,
      marginTop: 30,
      ...Platform.select({
        default: {
          fontSize: 17,
          color: textPrimaryColor(colorScheme),
        },
        android: {
          fontSize: 14,
          lineHeight: 20,
          color: textSecondaryColor(colorScheme),
          maxWidth: 260,
        },
      }),
    },
    link: {
      textDecorationLine: "underline",
    },
  });
};
