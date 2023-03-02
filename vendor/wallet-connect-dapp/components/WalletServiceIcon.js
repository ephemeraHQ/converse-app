import * as React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    fullWidth: { width: '100%' },
    icon: { borderRadius: 15 },
    noOverflow: { overflow: 'hidden' },
    title: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    padding: { padding: 5 },
});
export default function WalletServiceIcon({ width, height, walletService, connectToWalletService, size = 'md' }) {
    const uri = React.useMemo(() => (`https://registry.walletconnect.org/logo/${size}/${walletService.id}.jpeg`), [walletService, size]);
    const onPress = React.useCallback(() => (connectToWalletService(walletService)), [connectToWalletService, walletService]);
    return (React.createElement(TouchableOpacity, { onPress: onPress, style: [
            { width, height },
            styles.container,
            styles.padding,
        ] },
        React.createElement(Image, { style: [
                styles.icon,
                {
                    width: height * 0.6,
                    height: height * 0.6,
                },
            ], source: { uri } }),
        React.createElement(Text, { style: [styles.title, styles.fullWidth], numberOfLines: 1, ellipsizeMode: "tail" }, walletService.name)));
}
