// Initial rules from the WooCommerce shipping spec, in priority order. Slugs are resolved
// to category / footwear tile / shop tile ids the first time the rules collection is empty.
export interface ShippingRuleSeed {
  name: string;
  slugs: string[];
  charges: number[];
  additionalCharge: number;
}

export const SHIPPING_RULE_SEEDS: ShippingRuleSeed[] = [
  { name: 'Shoes under ₹1000', slugs: ['shoes-under-1000'], charges: [200], additionalCharge: 150 },
  { name: 'Formal Shoes', slugs: ['formal-shoes'], charges: [150, 300, 400], additionalCharge: 100 },
  { name: 'Hooka Mens Slide', slugs: ['hooka-mens-slide', 'hok-slide'], charges: [250], additionalCharge: 150 },
  { name: 'SlidesCrocs', slugs: ['slidescrocs', 'slides-crocs', 'slides-and-crocs'], charges: [200], additionalCharge: 100 },
  { name: 'SKT Shoes', slugs: ['skt-shoes'], charges: [250], additionalCharge: 150 },
  { name: 'Shoes under 6000', slugs: ['shoes-under-6000'], charges: [250], additionalCharge: 150 },
  { name: 'Buy 3 Shoes 10K', slugs: ['buy-3-shoes-10k', 'any-3-pairs-for-10000'], charges: [250], additionalCharge: 150 },
  { name: 'Luxury Shoes', slugs: ['luxury-shoes', 'luxury-shoe'], charges: [250], additionalCharge: 150 },
  { name: 'Jordon Premium Shoes', slugs: ['jordon-premium-shoes'], charges: [250], additionalCharge: 150 },
  { name: 'SMBA Shoes', slugs: ['smba-shoes'], charges: [250], additionalCharge: 150 },
  {
    name: '2-Piece Suits',
    slugs: ['2-piece-suits', 'premium-two-piece-suits', 'premium-two-piece-suit', 'premiu-two-piece-suits'],
    charges: [250],
    additionalCharge: 150,
  },
  {
    name: 'Luxury Formal Shirts',
    slugs: ['luxury-formal-shirts', 'luxury-formal-shirt', 'luxury-formal-shits'],
    charges: [150],
    additionalCharge: 50,
  },
  {
    name: 'Cargo / Lower / Pants / Jeans',
    slugs: [
      'view-all-cargos', 'linen-lowers', 'view-all-lowers', 'view-all-pants', 'view-all-jeans',
      'cargos', 'cargo', 'cargs', 'linen-lower', 'lowers', 'lower', 'trousers', 'trouser',
      'jeans', 'jean', 'jens', 'mens-jeans',
    ],
    charges: [150],
    additionalCharge: 70,
  },
  { name: 'Tracksuit', slugs: ['view-all-tracksuit', 'tracksuits'], charges: [150], additionalCharge: 150 },
  { name: 'Standard Clothing', slugs: ['formal-shirt', 'shirt-1500-combo'], charges: [100], additionalCharge: 50 },
];

export const FALLBACK_RULE_SEED = { name: 'Other / Unknown', charges: [100], additionalCharge: 50 };
