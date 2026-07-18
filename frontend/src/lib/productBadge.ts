// Shared visual mapping for ProductBadge values — keeps badge colors/labels
// consistent everywhere a product badge is rendered (Shop by Category, Footwear section, etc).
export const productBadgeStyles: Record<string, string> = {
  NEW: 'bg-emerald-600',
  SALE: 'bg-red-600',
  PREMIUM: 'bg-gray-900',
  TRENDING: 'bg-purple-600',
  COMBO: 'bg-orange-600',
  BEST_VALUE: 'bg-blue-600',
  LIMITED_SALE: 'bg-red-600',
  CASUAL: 'bg-gray-600',
  OFFER: 'bg-amber-600',
  UNDER_1K: 'bg-teal-600',
  BUDGET_PICK: 'bg-slate-700',
  LUXURY: 'bg-fuchsia-700',
};

export const productBadgeLabels: Record<string, string> = {
  BEST_VALUE: 'BEST VALUE',
  LIMITED_SALE: 'LIMITED SALE',
  UNDER_1K: 'UNDER ₹1K',
  BUDGET_PICK: 'BUDGET PICK',
};
