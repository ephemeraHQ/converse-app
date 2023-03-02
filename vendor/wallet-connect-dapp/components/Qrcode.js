import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import QR from 'react-native-qrcode-svg';
import Logo from '../assets/walletconnect-logo.png';
const padding = 15;
const styles = StyleSheet.create({
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    qr: {
        padding,
        backgroundColor: 'white',
        overflow: 'hidden',
        borderRadius: padding,
    },
});
export default function Qrcode({ size, uri, }) {
    return (React.createElement(View, { style: [{ width: size, height: size }, styles.center, styles.qr] }, typeof uri === 'string' && !!uri.length && (React.createElement(QR, { logo: Logo, logoSize: size * 0.2, value: uri, size: size - padding * 2 }))));
}
