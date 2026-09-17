import { registerAs } from '@nestjs/config';

export default registerAs('payu', () => {
  const mode = process.env.PAYU_MODE === 'test' ? 'test' : 'live';
  const isLive = mode === 'live';

  return {
    mode,
    merchantKey: process.env.PAYU_MERCHANT_KEY || '',
    // 32-bit Merchant Salt (V1) used for SHA-512 request/response hashing.
    merchantSalt: process.env.PAYU_MERCHANT_SALT || '',
    clientId: process.env.PAYU_CLIENT_ID || '',
    clientSecret: process.env.PAYU_CLIENT_SECRET || '',
    // Browser loads the Bolt SDK from here.
    boltScriptUrl: isLive
      ? 'https://jssdk.payu.in/bolt/bolt.min.js'
      : 'https://jssdk-uat.payu.in/bolt/bolt.min.js',
    // Server-to-server verify_payment reconciliation API.
    verifyBaseUrl: isLive ? 'https://info.payu.in' : 'https://test.payu.in',
    // surl/furl PayU posts the transaction result to (this API).
    callbackUrl: process.env.PAYU_CALLBACK_URL || '',
    // Where the browser is sent after PayU posts back to the callback.
    frontendUrl: process.env.PAYU_FRONTEND_URL || '',
  };
});
