export interface SizeGroupSeed {
  key: string;
  name: string;
  measurement: string;
  recommendedUse: string;
  sizes: string[];
  displayOrder: number;
}

const SHOE_SIZES = [
  'UK-3', 'UK-3.5', 'UK-4', 'UK-4.5', 'UK-5', 'UK-5.5', 'UK-6', 'UK-6.5', 'UK-7',
  'UK-7.5', 'UK-8', 'UK-8.5', 'UK-9', 'UK-9.5', 'UK-10', 'UK-10.5', 'UK-11',
  'UK-11.5', 'UK-12', 'UK-12.5', 'UK-13', 'UK-13.5', 'UK-14',
];

const CHEST_SIZES = ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60'];

const WAIST_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48'];

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export const SIZE_GROUP_SEEDS: SizeGroupSeed[] = [
  {
    key: 'SHOE',
    name: 'Shoe Sizes (UK)',
    measurement: 'Shoes Size',
    recommendedUse: 'Men Shoes, Formal Shoes, Women Shoes — Sneakers / Casual / Formal / Luxury',
    sizes: SHOE_SIZES,
    displayOrder: 1,
  },
  {
    key: 'CHEST',
    name: 'Chest Sizes',
    measurement: 'Chest Size',
    recommendedUse: 'Shirt, T-Shirt, Shirt Plus Size, T-Shirt Plus Size, 2-Piece Suit (coat)',
    sizes: CHEST_SIZES,
    displayOrder: 2,
  },
  {
    key: 'WAIST',
    name: 'Waist Sizes',
    measurement: 'Waist Size',
    recommendedUse: 'Jeans, Lower, Pants / Trousers / Cargos, 2-Piece Suit (trouser)',
    sizes: WAIST_SIZES,
    displayOrder: 3,
  },
  {
    key: 'CLOTHING',
    name: 'Clothing Sizes',
    measurement: 'Standard Size',
    recommendedUse: 'General apparel that uses letter sizing',
    sizes: CLOTHING_SIZES,
    displayOrder: 4,
  },
];
