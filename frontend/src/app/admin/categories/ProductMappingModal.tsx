'use client';

import { useState, useEffect } from 'react';
import { productApi } from '@/lib/api';
import { Category, Product } from '@/types';

interface ProductMappingModalProps {
  category: Category;
  onClose: () => void;
}

function ProductRow({
  product,
  isSaving,
  onToggle,
}: {
  product: Product;
  isSaving: boolean;
  onToggle: (product: Product, field: 'isBestSeller' | 'showInLatestArrivals') => void;
}) {
  return (
    <tr className={isSaving ? 'opacity-50' : ''}>
      <td className="px-3 py-2">
        <div className="flex items-center gap-3">
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-10 w-10 rounded object-cover border border-gray-200"
            />
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">{product.name}</div>
            <div className="text-xs text-gray-500">{product.sku}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-center">
        <input
          type="checkbox"
          disabled={isSaving}
          checked={product.showInLatestArrivals || false}
          onChange={() => onToggle(product, 'showInLatestArrivals')}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <input
          type="checkbox"
          disabled={isSaving}
          checked={product.isBestSeller || false}
          onChange={() => onToggle(product, 'isBestSeller')}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
        />
      </td>
    </tr>
  );
}

export default function ProductMappingModal({ category, onClose }: ProductMappingModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<string[]>([]);

  // Search-any-product state — lets an admin flag a product that isn't in this category
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await productApi.getByCategory(category._id);
        setProducts(response.data.data || response.data || []);
      } catch (err) {
        console.error('Failed to fetch products for category:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [category._id]);

  const runSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    try {
      const response = await productApi.getAll({ search: query, limit: 20 });
      const results: Product[] = response.data.data || response.data || [];
      setSearchResults(results);
    } catch (err) {
      console.error('Failed to search products:', err);
      setSearchError('Failed to search products. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFlag = async (product: Product, field: 'isBestSeller' | 'showInLatestArrivals') => {
    const newValue = !product[field];
    setSavingIds((prev) => [...prev, product._id]);
    setError(null);
    setSearchError(null);

    try {
      await productApi.update(product._id, { [field]: newValue });
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, [field]: newValue } : p)),
      );
      setSearchResults((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, [field]: newValue } : p)),
      );
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
      setError(`Failed to update product. Please try again.`);
    } finally {
      setSavingIds((prev) => prev.filter((id) => id !== product._id));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Map Homepage Products &mdash; {category.name}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Pick which products show in the homepage Latest Arrivals / Best Sellers sections. A
            product only appears under its own category&apos;s section, and Latest Arrivals only
            takes effect while that category is toggled &quot;Show in Latest Arrivals&quot;.
          </p>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          {/* Search any product, regardless of category */}
          <div className="mb-6 border border-gray-200 rounded-md p-3 bg-gray-50">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Map any product (search by name or SKU)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    runSearch();
                  }
                }}
                placeholder="e.g., Running Shoes or SKU123"
                className="text-black flex-1 border border-gray-300 rounded-md shadow-sm py-1.5 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={runSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {searchError && <p className="mt-2 text-xs text-red-600">{searchError}</p>}

            {hasSearched && !isSearching && searchResults.length === 0 && !searchError && (
              <p className="mt-2 text-xs text-gray-500">No products matched &quot;{searchQuery}&quot;.</p>
            )}

            {searchResults.length > 0 && (
              <table className="min-w-full divide-y divide-gray-200 mt-3">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Latest Arrivals
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Best Seller
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {searchResults.map((product) => (
                    <ProductRow
                      key={product._id}
                      product={product}
                      isSaving={savingIds.includes(product._id)}
                      onToggle={toggleFlag}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
            Products in &quot;{category.name}&quot;
          </h4>

          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No products found in this category.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Latest Arrivals
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Best Seller
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <ProductRow
                    key={product._id}
                    product={product}
                    isSaving={savingIds.includes(product._id)}
                    onToggle={toggleFlag}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
