import * as React from "react";
const defaultState = Object.freeze({
    data: [],
    error: undefined,
    loading: true,
});
export default function useMobileRegistry() {
    const [state, setState] = React.useState(defaultState);
    React.useEffect(() => {
        (async () => {
            try {
                const result = await fetch("https://registry.walletconnect.org/data/wallets.json");
                const data = await result.json();
                setState({
                    data: Object.values(data),
                    error: undefined,
                    loading: false,
                });
            }
            catch (error) {
                console.error(error);
                setState({ ...defaultState, error: error, loading: false });
            }
        })();
    }, [setState]);
    return state;
}
