import { createHash } from 'crypto';

const sha512 = (value: string): string =>
  createHash('sha512').update(value).digest('hex');

export interface PayuHashParams {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

// Request hash PayU expects in the Bolt/_payment params:
// sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
export function buildRequestHash(p: PayuHashParams, salt: string): string {
  const seq = [
    p.key,
    p.txnid,
    p.amount,
    p.productinfo,
    p.firstname,
    p.email,
    p.udf1 || '',
    p.udf2 || '',
    p.udf3 || '',
    p.udf4 || '',
    p.udf5 || '',
    '',
    '',
    '',
    '',
    '',
    salt,
  ];
  return sha512(seq.join('|'));
}

// Reverse hash PayU sends back in the transaction response. Verifies the
// response actually came from PayU and wasn't tampered with.
// sha512([additionalCharges|]SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
export function buildResponseHash(
  payload: Record<string, any>,
  key: string,
  salt: string,
): string {
  const seq = [
    salt,
    payload.status || '',
    '',
    '',
    '',
    '',
    '',
    payload.udf5 || '',
    payload.udf4 || '',
    payload.udf3 || '',
    payload.udf2 || '',
    payload.udf1 || '',
    payload.email || '',
    payload.firstname || '',
    payload.productinfo || '',
    payload.amount || '',
    payload.txnid || '',
    key,
  ];
  if (payload.additionalCharges) {
    seq.unshift(payload.additionalCharges);
  }
  return sha512(seq.join('|'));
}

// Hash for the verify_payment reconciliation API: sha512(key|command|var1|SALT)
export function buildVerifyHash(
  key: string,
  command: string,
  var1: string,
  salt: string,
): string {
  return sha512([key, command, var1, salt].join('|'));
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
