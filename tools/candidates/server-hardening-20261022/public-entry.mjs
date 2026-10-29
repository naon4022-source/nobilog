// The latest public release base stays separate from the large local update.
import app from '../../releases/google-entry-20261021/nobilog-board/src/index.js';
import {attachGateway} from './attach-gateway.mjs';
export {NobiSecurityGate} from './security-rate-do.mjs';
export default attachGateway(app);
