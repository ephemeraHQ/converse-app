import * as React from 'react';
import { QrcodeModal } from '../components';
const defaultRenderQrcodeModal = (props) => React.createElement(QrcodeModal, { ...props, division: 4 });
export default defaultRenderQrcodeModal;
