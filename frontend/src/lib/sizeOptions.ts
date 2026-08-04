// Standard size vocabularies offered in the admin "Sizes & Stock" picker, so a brand-new
// category always has sensible sizes to pick from instead of a dead "no sizes yet" dropdown.
export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
export const SHOE_SIZES = ['5', '6', '7', '8', '9', '10', '11', '12', '13'];
export const DRESS_SIZES = ['0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20'];

export interface SizeGroup {
  label: string;
  sizes: string[];
}

const PREDEFINED_GROUPS: SizeGroup[] = [
  { label: 'Clothing Sizes', sizes: CLOTHING_SIZES },
  { label: 'Shoe Sizes', sizes: SHOE_SIZES },
  { label: 'Dress / Numeric Sizes', sizes: DRESS_SIZES },
];

const PREDEFINED_FLAT = new Set<string>([...CLOTHING_SIZES, ...SHOE_SIZES, ...DRESS_SIZES]);

// Builds the groups to render in a size picker: sizes already used in this scope that
// aren't part of the standard predefined lists (e.g. a legacy custom size) come first,
// followed by the predefined Clothing/Shoe/Dress groups — so the picker always has
// options, even for a category with zero existing products.
export function buildSizeGroups(knownSizes: string[]): SizeGroup[] {
  const other = knownSizes.filter((s) => !PREDEFINED_FLAT.has(s));
  return [
    ...(other.length > 0 ? [{ label: 'Used in this category', sizes: other }] : []),
    ...PREDEFINED_GROUPS,
  ];
}
