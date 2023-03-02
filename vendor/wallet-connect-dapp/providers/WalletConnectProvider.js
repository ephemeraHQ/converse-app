import WalletConnect from '@walletconnect/client';
import deepmerge from 'deepmerge';
import { KeyValueStorage } from 'keyvaluestorage';
import * as React from 'react';
import { Linking, Platform } from 'react-native';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { defaultRenderQrcodeModal, formatWalletServiceUrl } from '../constants';
import { WalletConnectContext } from '../contexts';
import { useMobileRegistry, useWalletConnectContext } from '../hooks';
import { ConnectorEvents, } from '../types';
const defaultState = Object.freeze({
    visible: false,
});
export default function WalletConnectProvider({ children, renderQrcodeModal: maybeRenderQrcodeModal, ...extras }) {
    const { error: walletServicesError, data: walletServices } = useMobileRegistry();
    const [state, setState] = React.useState(defaultState);
    const parentContext = useWalletConnectContext();
    const intermediateValue = React.useMemo(() => deepmerge(parentContext, extras), [parentContext, extras]);
    const renderQrcodeModal = React.useMemo(() => (typeof maybeRenderQrcodeModal === 'function'
        ? maybeRenderQrcodeModal
        : defaultRenderQrcodeModal), [maybeRenderQrcodeModal]);
    const open = React.useCallback(async (uri, cb) => {
        if (Platform.OS === 'android') {
            const canOpenURL = await Linking.canOpenURL(uri);
            if (!canOpenURL) {
                Linking.openURL('https://walletconnect.org/wallets');
                throw new Error('No wallets found.');
            }
            await Linking.openURL(uri);
        }
        setState({
            uri,
            visible: true,
            cb,
        });
        return undefined;
    }, [setState]);
    const close = React.useCallback(() => {
        setState((currentState) => {
            const { cb } = currentState;
            setTimeout(() => typeof cb === 'function' && cb(), 0);
            return {
                uri: undefined,
                visible: false,
                cb: undefined,
            };
        });
        return undefined;
    }, [setState]);
    const qrcodeModal = React.useMemo(() => ({
        open,
        close,
    }), [open, close]);
    const { storageOptions, redirectUrl } = intermediateValue;
    const createStorage = React.useCallback((storageOptions) => {
        return new KeyValueStorage(storageOptions);
    }, []);
    const [storage, setStorage] = React.useState(() => createStorage(storageOptions));
    useDeepCompareEffect(() => {
        setStorage(createStorage(storageOptions));
    }, [setStorage, storageOptions]);
    const sessionStorageKey = React.useMemo(() => `${storageOptions.rootStorageKey}:session`, [storageOptions]);
    const walletServiceStorageKey = React.useMemo(() => `${storageOptions.rootStorageKey}:walletService`, [storageOptions]);
    const connectToWalletService = React.useCallback(async (walletService, uri) => {
        if (typeof uri !== 'string' || !uri.length) {
            return Promise.reject(new Error('Invalid uri.'));
        }
        const maybeRedirectUrl = typeof redirectUrl === "string"
            ? `&redirectUrl=${encodeURIComponent(redirectUrl)}`
            : "";
        const connectionUrl = `${formatWalletServiceUrl(walletService)}/wc?uri=${encodeURIComponent(uri)}${maybeRedirectUrl}`;
        if (await Linking.canOpenURL(connectionUrl)) {
            return await Promise.all([
                storage.setItem(walletServiceStorageKey, walletService),
                Linking.openURL(connectionUrl),
            ]) && undefined;
        }
        return Promise.reject(new Error('Unable to open url.'));
    }, [walletServiceStorageKey, storage, redirectUrl, state]);
    const [connector, setConnector] = React.useState();
    const createConnector = React.useCallback(async function shouldCreateConnector(params) {
        const { storageOptions: _storageOptions, ...extras } = params;
        const [maybeExistingSession, maybeExistingWalletService,] = await Promise.all([
            await storage.getItem(sessionStorageKey),
            await storage.getItem(walletServiceStorageKey),
        ]);
        const isResumable = !!maybeExistingSession && (Platform.OS === 'android' || !!maybeExistingWalletService);
        if (!isResumable) {
            await Promise.all([
                storage.removeItem(sessionStorageKey),
                storage.removeItem(walletServiceStorageKey),
            ]);
        }
        const nextConnector = new WalletConnect({
            session: isResumable ? maybeExistingSession : undefined,
            qrcodeModal,
            ...extras,
        });
        const maybeThrowError = (error) => {
            if (error) {
                throw error;
            }
        };
        nextConnector.on(ConnectorEvents.CONNECT, async (error) => {
            maybeThrowError(error);
            await storage.setItem(sessionStorageKey, nextConnector.session);
        });
        nextConnector.on(ConnectorEvents.CALL_REQUEST_SENT, async (error) => {
            maybeThrowError(error);
            if (Platform.OS === 'android') {
                const { peerMeta } = nextConnector;
                if (!!peerMeta && typeof peerMeta === 'object') {
                    const [maybeShortName] = `${peerMeta.name || ''}`.toLowerCase().split(/\s+/);
                    if (typeof maybeShortName === 'string' && !!maybeShortName.length) {
                        const { walletServices } = parentContext;
                        const [...maybeMatchingServices] = (walletServices || []).filter(({ metadata: { shortName } }) => {
                            return `${shortName}`.toLowerCase() === maybeShortName;
                        });
                        if (maybeMatchingServices.length === 1) {
                            const [detectedWalletService] = maybeMatchingServices;
                            const url = formatWalletServiceUrl(detectedWalletService);
                            if (await Linking.canOpenURL(url)) {
                                return Linking.openURL(url);
                            }
                        }
                    }
                }
                Linking.openURL('wc:');
            }
            else if (Platform.OS !== 'web') {
                const walletService = await storage.getItem(walletServiceStorageKey);
                if (!walletService) {
                    return maybeThrowError(new Error('Cached WalletService not found.'));
                }
                const url = formatWalletServiceUrl(walletService);
                return (await Linking.canOpenURL(url)) && Linking.openURL(url);
            }
        });
        nextConnector.on(ConnectorEvents.SESSION_UPDATE, async (error) => {
            maybeThrowError(error);
            await storage.setItem(sessionStorageKey, nextConnector.session);
        });
        nextConnector.on(ConnectorEvents.DISCONNECT, async (error) => {
            await Promise.all([
                storage.setItem(sessionStorageKey, undefined),
                storage.setItem(walletServiceStorageKey, undefined),
            ]);
            setConnector(await shouldCreateConnector(params));
            maybeThrowError(error);
        });
        return nextConnector;
    }, [
        sessionStorageKey,
        walletServiceStorageKey,
        storage,
        qrcodeModal,
        setConnector,
        parentContext,
    ]);
    useDeepCompareEffect(() => {
        (async () => {
            setConnector(await createConnector(intermediateValue));
        })();
    }, [setConnector, createConnector, intermediateValue]);
    const onDismiss = React.useCallback(() => {
        close();
        (async () => {
            setConnector(await createConnector(intermediateValue));
        })();
    }, [close, setConnector, createConnector, intermediateValue]);
    const modalProps = React.useMemo(() => ({
        connectToWalletService,
        visible: state.visible,
        walletServices,
        uri: state.uri,
        onDismiss,
    }), [
        state.visible,
        connectToWalletService,
        walletServices,
        state.uri,
        onDismiss,
    ]);
    const value = React.useMemo(() => {
        if (connector) {
            return {
                ...intermediateValue,
                walletServices,
                connectToWalletService,
                connector: Object.assign(Object.create(connector), {
                    ...connector,
                    connect: async (opts) => {
                        if (!walletServices.length) {
                            throw new Error('Mobile registry not yet ready.');
                        }
                        else if (walletServicesError) {
                            throw walletServicesError;
                        }
                        const nextConnector = await createConnector(intermediateValue);
                        setConnector(nextConnector);
                        return nextConnector.connect(opts);
                    },
                }),
            };
        }
        return {
            ...intermediateValue,
            walletServices,
            connectToWalletService,
            connector,
        };
    }, [
        intermediateValue,
        connectToWalletService,
        connector,
        state,
        setConnector,
        walletServices,
        walletServicesError,
    ]);
    return (React.createElement(WalletConnectContext.Provider, { value: value },
        !!children && children,
        Platform.OS !== 'android' && renderQrcodeModal(modalProps)));
}
