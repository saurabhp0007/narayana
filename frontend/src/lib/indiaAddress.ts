export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

export interface PincodeInfo {
  district: string;
  state: string;
}

interface PincodeData {
  states: string[];
  pincodes: Record<string, [string, number]>;
}

// ~60KB gzipped, so it's fetched only when a customer types a PIN code.
let dataPromise: Promise<PincodeData> | null = null;

const loadPincodeData = () => {
  dataPromise ??= fetch('/data/india-pincodes.json').then((res) => {
    if (!res.ok) throw new Error('Failed to load PIN code data');
    return res.json();
  });
  dataPromise.catch(() => {
    dataPromise = null;
  });
  return dataPromise;
};

export async function lookupPincode(pincode: string): Promise<PincodeInfo | null> {
  if (!PINCODE_REGEX.test(pincode)) return null;
  const data = await loadPincodeData();
  const entry = data.pincodes[pincode];
  return entry ? { district: entry[0], state: data.states[entry[1]] } : null;
}
