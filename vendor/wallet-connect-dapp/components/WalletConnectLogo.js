import * as React from 'react';
import Svg, { G, Path } from 'react-native-svg';
const logoWidth = 1459;
const logoHeight = 238;
export const aspectRatio = logoHeight / logoWidth;
export const defaultColor = '#3B99FB';
export default function WalletConnectLogo({ width, color, }) {
    const height = width * aspectRatio;
    return (React.createElement(Svg, { width: `${width}`, height: `${height}`, viewBox: `0 0 ${logoWidth} ${logoHeight}` },
        React.createElement(G, { fill: "none", fillRule: "evenodd" },
            React.createElement(Path, { d: "M526.767 130.224l-20.024 72.055h-20.827L458 96.827h22.874l16.588 76.367h.585l19.731-76.367h18.635l19.731 76.367h.585l16.662-76.367h22.873l-27.989 105.452h-20.827l-20.023-72.055h-.658zm99.898 57.878c9.281 0 16.954-6.066 16.954-14.543v-5.7l-16.515 1.023c-7.966.585-12.497 4.166-12.497 9.72 0 5.846 4.823 9.5 12.058 9.5zm-7.015 15.42c-14.908 0-26.236-9.647-26.236-23.751 0-14.25 10.962-22.508 30.474-23.677l19.731-1.17v-5.188c0-7.308-5.115-11.547-13.154-11.547-7.965 0-13.008 3.947-14.03 9.72h-19.513c.804-15.2 13.739-25.65 34.493-25.65 20.097 0 33.178 10.376 33.178 26.161v53.86h-20.608v-11.986h-.439c-4.384 8.331-14.104 13.228-23.896 13.228zm59.193-1.243V96.827h21.339v105.452h-21.339zm36.247 0V96.827h21.339v105.452H715.09zm70.886-64.236c-9.354 0-16.077 7.089-16.808 16.881h33.25c-.438-10.011-6.942-16.88-16.442-16.88zm16.735 40.266h19.585c-2.338 15.347-16.37 25.651-35.735 25.651-24.116 0-38.586-15.42-38.586-40.485 0-24.993 14.616-41.217 37.782-41.217 22.8 0 37.197 15.42 37.197 39.243v6.504h-54.005v1.316c0 11.18 7.088 18.854 17.977 18.854 7.82 0 13.812-3.873 15.785-9.866zm36.905-72.42h21.339v18.05h14.47v16.077h-14.47v37.49c0 5.992 2.923 8.842 9.208 8.842 1.9 0 3.873-.146 5.188-.365v15.712c-2.192.511-5.846.877-10.158.877-18.416 0-25.577-6.14-25.577-21.412v-41.144H828.58V123.94h11.035v-18.05zm95.952 98.217c-30.693 0-49.913-20.535-49.913-54.59 0-33.98 19.366-54.516 49.913-54.516 25.358 0 44.65 16.077 46.332 39.682h-21.486c-2.046-12.935-11.984-21.412-24.846-21.412-16.662 0-27.405 13.958-27.405 36.173 0 22.509 10.597 36.394 27.478 36.394 13.08 0 22.508-7.674 24.847-20.17h21.485c-2.485 23.531-20.535 38.44-46.405 38.44zm94.125-.146c-23.678 0-38.805-15.2-38.805-40.924 0-25.358 15.347-40.778 38.805-40.778s38.805 15.347 38.805 40.778c0 25.797-15.128 40.924-38.805 40.924zm0-16.297c10.45 0 17.1-8.842 17.1-24.554 0-15.566-6.723-24.554-17.1-24.554-10.377 0-17.174 8.988-17.174 24.554 0 15.712 6.65 24.554 17.174 24.554zm49.766 14.616v-78.34h20.608v13.958h.439c4.165-9.72 12.423-15.42 24.481-15.42 17.393 0 27.185 10.962 27.185 29.305v50.497h-21.339v-46.04c0-10.23-4.823-16.077-14.396-16.077s-15.639 7.016-15.639 17.174v44.943h-21.339zm86.233 0v-78.34h20.608v13.958h.438c4.166-9.72 12.424-15.42 24.482-15.42 17.392 0 27.185 10.962 27.185 29.305v50.497h-21.339v-46.04c0-10.23-4.823-16.077-14.396-16.077-9.574 0-15.64 7.016-15.64 17.174v44.943h-21.338zm121.383-64.236c-9.354 0-16.077 7.089-16.808 16.881h33.25c-.438-10.011-6.942-16.88-16.442-16.88zm16.735 40.266h19.585c-2.338 15.347-16.37 25.651-35.735 25.651-24.116 0-38.586-15.42-38.586-40.485 0-24.993 14.616-41.217 37.782-41.217 22.8 0 37.197 15.42 37.197 39.243v6.504h-54.005v1.316c0 11.18 7.089 18.854 17.977 18.854 7.82 0 13.812-3.873 15.785-9.866zm102.383-25.212h-19.804c-1.242-8.257-6.723-14.104-15.493-14.104-10.523 0-17.1 8.916-17.1 24.043 0 15.42 6.577 24.189 17.173 24.189 8.55 0 14.104-5.115 15.42-13.666h19.877c-1.096 18.49-14.908 30.401-35.516 30.401-23.604 0-38.585-15.346-38.585-40.924 0-25.139 14.98-40.778 38.439-40.778 21.193 0 34.64 13.081 35.59 30.84zm16.077-47.208h21.34v18.05h14.469v16.077h-14.47v37.49c0 5.992 2.923 8.842 9.208 8.842 1.9 0 3.873-.146 5.189-.365v15.712c-2.193.511-5.847.877-10.158.877-18.416 0-25.578-6.14-25.578-21.412v-41.144h-11.034V123.94h11.034v-18.05z", fill: color || defaultColor }),
            React.createElement(Path, { d: "M79.5 46.539c63.216-61.894 165.71-61.894 228.926 0l7.608 7.449a7.808 7.808 0 0 1 0 11.207l-26.026 25.482a4.108 4.108 0 0 1-5.723 0l-10.47-10.251c-44.101-43.179-115.604-43.179-159.705 0l-11.212 10.978a4.108 4.108 0 0 1-5.723 0L71.149 65.922a7.808 7.808 0 0 1 0-11.207l8.35-8.176zm282.75 52.699l23.163 22.679a7.808 7.808 0 0 1 0 11.206L280.97 235.385c-3.161 3.095-8.286 3.095-11.447 0l-74.128-72.578a2.054 2.054 0 0 0-2.862 0l-74.127 72.578c-3.16 3.095-8.285 3.095-11.446 0L2.51 133.122a7.808 7.808 0 0 1 0-11.207l23.164-22.679c3.16-3.094 8.285-3.094 11.446 0l74.13 72.58c.79.773 2.07.773 2.861 0l74.126-72.58c3.16-3.094 8.285-3.094 11.446 0l74.13 72.58c.79.773 2.071.773 2.861 0l74.129-72.578c3.16-3.095 8.285-3.095 11.446 0z", fill: color || defaultColor, fillRule: "nonzero" }))));
}
