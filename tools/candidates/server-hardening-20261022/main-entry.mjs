// Import existing app unchanged; not active until a separate configuration uses it.
import app from '../../../cf-worker/src/index.js';
import {attachGateway} from './attach-gateway.mjs';
export {NobiSecurityGate} from './security-rate-do.mjs';
export default attachGateway(app);
