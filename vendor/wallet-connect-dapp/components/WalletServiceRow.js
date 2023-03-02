import * as React from 'react';
import { Animated, StyleSheet } from 'react-native';
import WalletServiceIcon from './WalletServiceIcon';
const styles = StyleSheet.create({
    row: { alignItems: 'center', flexDirection: 'row' },
});
export default function WalletServiceRow({ style, width, height, walletServices, division, connectToWalletService, }) {
    return (React.createElement(Animated.View, { style: [{ width, height }, styles.row, StyleSheet.flatten(style)] }, walletServices.map((walletService, i) => (React.createElement(WalletServiceIcon, { key: `i${i}`, width: width / division, height: height, walletService: walletService, connectToWalletService: connectToWalletService })))));
}
;
