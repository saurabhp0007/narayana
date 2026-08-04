'use client';

import { useEffect, useState } from 'react';
import { productApi } from '@/lib/api';

interface SizeFilterProps {
  // Scope the available sizes to a gender/category (e.g. shoe sizes for Footwear,
  // S/M/L for Shirts) so the filter never offers a size with zero matching products.
  // Leave both unset to show every size used across the whole catalog.
  genderId?: string;
  categoryId?: string;
  selectedSizes: string[];
  onChange: (sizes: string[]) => void;
  className?: string;
}

// Reusable size filter: fetches the sizes actually present for the given scope and
// renders them as toggleable pills. Used on the products listing page today, and on
// any other product-listing surface (e.g. a category page) that wants the same filter.
export default function SizeFilter({
  genderId,
  categoryId,
  selectedSizes,
  onChange,
  className,
}: SizeFilterProps) {
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    productApi
      .getSizes({ genderId: genderId || undefined, categoryId: categoryId || undefined })
      .then((res) => {
        if (!cancelled) setAvailableSizes(res.data || []);
      })
      .catch((err) => console.error('Failed to fetch available sizes:', err));
    return () => {
      cancelled = true;
    };
  }, [genderId, categoryId]);

  if (availableSizes.length === 0) return null;

  const toggleSize = (size: string) => {
    onChange(
      selectedSizes.includes(size)
        ? selectedSizes.filter((s) => s !== size)
        : [...selectedSizes, size]
    );
  };

  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700 mb-2">Size</label>
      <div className="flex flex-wrap gap-2">
        {availableSizes.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => toggleSize(size)}
            className={`min-w-[2.5rem] px-2.5 py-1.5 border rounded-md text-xs font-medium transition-colors ${
              selectedSizes.includes(size)
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
