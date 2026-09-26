import pincodeData from '../data/india-pincodes.json';

const data = pincodeData as { states: string[]; pincodes: Record<string, [string, number]> };

export const INDIAN_STATES = data.states;

export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

export interface PincodeInfo {
  district: string;
  state: string;
}

export function lookupPincode(pincode: string): PincodeInfo | null {
  if (!PINCODE_REGEX.test(pincode)) return null;
  const entry = data.pincodes[pincode];
  return entry ? { district: entry[0], state: data.states[entry[1]] } : null;
}
