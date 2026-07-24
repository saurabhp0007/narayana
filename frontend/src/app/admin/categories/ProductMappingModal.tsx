'use client';

import { useState, useEffect, useMemo } from 'react';
import { productApi } from '@/lib/api';
import { Category, Product } from '@/types';

interface ProductMappingModalProps {
  category: Category;
  onClose: () => void;
}

type HomepageField = 'isBestSeller' | 'showInLatestArrivals';
type PendingChanges = Record<string, Partial<Record<HomepageField, boolean>>>;

function ProductRow({
  product,
  pending,
  disabled,
  onToggle,
}: {
  product: Product;
  pending: Partial<Record<HomepageField, boolean>> | undefined;
  disabled: boolean;
  onToggle: (product: Product, field: HomepageField) => void;
}) {
  const latestArrivals = pending?.showInLatestArrivals ?? product.showInLatestArrivals ?? false;
  const bestSeller = pending?.isBestSeller ?? product.isBestSeller ?? false;
  const isDirty = pending && Object.keys(pending).length > 0;

  return (
    <tr className={isDirty ? 'bg-amber-50' : ''}>
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
          disabled={disabled}
          checked={latestArrivals}
          onChange={() => onToggle(product, 'showInLatestArrivals')}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <input
          type="checkbox"
          disabled={disabled}
          checked={bestSeller}
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

  // Search-any-product state — lets an admin flag a product that isn't in this category
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Checkbox edits are staged here until "Save Changes" is clicked
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productApi.getAll({ categoryId: category._id, limit: 200 });
      setProducts(response.data.data || response.data || []);
    } catch (err) {
      console.error('Failed to fetch products for category:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const toggleFlag = (product: Product, field: HomepageField) => {
    setSuccessMessage(null);
    const currentValue = pendingChanges[product._id]?.[field] ?? product[field] ?? false;
    setPendingChanges((prev) => ({
      ...prev,
      [product._id]: { ...prev[product._id], [field]: !currentValue },
    }));
  };

  const pendingCount = Object.keys(pendingChanges).length;

  // Products touched by pending edits but not already visible in either list
  // (e.g. found via search, then the search box was cleared/changed)
  const productLookup = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(p._id, p);
    for (const p of searchResults) map.set(p._id, p);
    return map;
  }, [products, searchResults]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSuccessMessage(null);

    const entries = Object.entries(pendingChanges);
    const results = await Promise.allSettled(
      entries.map(([productId, changes]) => productApi.update(productId, changes)),
    );

    const failedIds: string[] = [];
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        failedIds.push(entries[i][0]);
      }
    });

    if (failedIds.length === 0) {
      // Apply saved changes onto local product lists and clear pending state
      setProducts((prev) =>
        prev.map((p) => (pendingChanges[p._id] ? { ...p, ...pendingChanges[p._id] } : p)),
      );
      setSearchResults((prev) =>
        prev.map((p) => (pendingChanges[p._id] ? { ...p, ...pendingChanges[p._id] } : p)),
      );
      setPendingChanges({});
      setSuccessMessage(`Saved ${entries.length} product${entries.length === 1 ? '' : 's'}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      // Keep failed changes pending so the admin can retry; drop the ones that succeeded
      const stillPending: PendingChanges = {};
      failedIds.forEach((id) => {
        stillPending[id] = pendingChanges[id];
      });
      const succeededChanges = { ...pendingChanges };
      failedIds.forEach((id) => delete succeededChanges[id]);
      setProducts((prev) =>
        prev.map((p) => (succeededChanges[p._id] ? { ...p, ...succeededChanges[p._id] } : p)),
      );
      setSearchResults((prev) =>
        prev.map((p) => (succeededChanges[p._id] ? { ...p, ...succeededChanges[p._id] } : p)),
      );
      setPendingChanges(stillPending);

      const names = failedIds.map((id) => productLookup.get(id)?.name || id).join(', ');
      setSaveError(`Failed to save: ${names}. Please try again.`);
    }

    setIsSaving(false);
  };

  const handleClose = () => {
    if (pendingCount > 0 && !isSaving) {
      const discard = window.confirm(
        `You have ${pendingCount} unsaved change${pendingCount === 1 ? '' : 's'}. Discard and close?`,
      );
      if (!discard) return;
    }
    onClose();
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
            takes effect while that category is toggled &quot;Show in Latest Arrivals&quot;. Check
            the boxes below, then click <span className="font-medium">Save Changes</span>.
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
                      pending={pendingChanges[product._id]}
                      disabled={isSaving}
                      onToggle={toggleFlag}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchProducts}
                className="ml-3 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {saveError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {saveError}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              {successMessage}
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
              No products found in this category. Use the search above to map products from other
              categories instead.
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
                    pending={pendingChanges[product._id]}
                    disabled={isSaving}
                    onToggle={toggleFlag}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 flex items-center justify-between rounded-b-lg">
          <span className="text-xs text-gray-500">
            {pendingCount > 0
              ? `${pendingCount} unsaved change${pendingCount === 1 ? '' : 's'}`
              : 'No unsaved changes'}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {pendingCount > 0 ? 'Discard & Close' : 'Close'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pendingCount === 0 || isSaving}
              className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
