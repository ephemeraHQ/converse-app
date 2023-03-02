import * as React from 'react';
import { WalletConnectProvider } from '../providers';
const withWalletConnectThunk = (Component, options) => function WithWalletConnect(props) {
    return (React.createElement(WalletConnectProvider, { ...(options || {}) },
        React.createElement(Component, { ...props })));
};
export default withWalletConnectThunk;
