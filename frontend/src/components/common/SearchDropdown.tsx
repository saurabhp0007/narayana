'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDataStore } from '@/store/dataStore';
import { productApi } from '@/lib/api';
import { Product } from '@/types';

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 5;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch {
    return [];
  }
}

function addRecentSearch(term: string): string[] {
  const trimmed = term.trim();
  if (!trimmed) return getRecentSearches();
  const existing = getRecentSearches().filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
  const updated = [trimmed, ...existing].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  return updated;
}

function removeRecentSearch(term: string): string[] {
  const updated = getRecentSearches().filter((s) => s !== term);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  return updated;
}

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  align?: 'left' | 'right';
  showInput?: boolean;
  fullWidth?: boolean;
  externalQuery?: string;
  onExternalQueryChange?: (query: string) => void;
}

export default function SearchDropdown({
  isOpen,
  onClose,
  align = 'right',
  showInput = true,
  fullWidth = false,
  externalQuery = '',
  onExternalQueryChange
}: SearchDropdownProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { allCategories, featuredProducts, fetchAllCategories, fetchFeaturedProducts } = useDataStore();

  const [internalQuery, setInternalQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [matchingCategories, setMatchingCategories] = useState<{ _id: string; name: string; slug: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Use external query if provided, otherwise use internal
  const searchQuery = onExternalQueryChange ? externalQuery : internalQuery;
  const setSearchQuery = onExternalQueryChange ? onExternalQueryChange : setInternalQuery;

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current && showInput) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }

    // Reset state when closing
    if (!isOpen) {
      if (!onExternalQueryChange) {
        setInternalQuery('');
      }
      setSearchResults([]);
      setShowResults(false);
    }
  }, [isOpen, showInput, onExternalQueryChange]);

  // Ensure data is loaded
  useEffect(() => {
    if (isOpen) {
      fetchAllCategories();
      fetchFeaturedProducts(4);
      setRecentSearches(getRecentSearches());
    }
  }, [isOpen, fetchAllCategories, fetchFeaturedProducts]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Delay to prevent immediate close
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Debounced live search-as-you-type. Uses the lightweight autosuggest endpoint
  // (products + matching categories in one call) rather than the full product list
  // endpoint, since this dropdown only ever renders a handful of suggestions.
  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setMatchingCategories([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      const response = await productApi.autosuggest(query, 6);
      const { products = [], categories = [] } = response.data || {};
      // autosuggest returns a single `image` field; normalize to the `images` array
      // shape the rest of this component (and the product detail link) expects.
      type AutosuggestProduct = { _id: string; name: string; sku: string; price: number; discountPrice?: number; image: string | null };
      setSearchResults(
        (products as AutosuggestProduct[]).map((p) => ({
          ...p,
          images: p.image ? [p.image] : [],
        })) as unknown as Product[],
      );
      setMatchingCategories(categories);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      setMatchingCategories([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Watch for external query changes
  useEffect(() => {
    if (onExternalQueryChange && externalQuery) {
      // Clear previous timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce search
      debounceRef.current = setTimeout(() => {
        performSearch(externalQuery);
      }, 300);
    }
  }, [externalQuery, onExternalQueryChange, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setRecentSearches(addRecentSearch(searchQuery));
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      onClose();
    }
  };

  const handleRecentSearchClick = (term: string) => {
    setSearchQuery(term);
    performSearch(term);
  };

  const handleRemoveRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    setRecentSearches(removeRecentSearch(term));
  };

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/products?categoryId=${categoryId}`);
    onClose();
  };

  const handleProductClick = (productId: string) => {
    if (searchQuery.trim()) {
      setRecentSearches(addRecentSearch(searchQuery));
    }
    router.push(`/products/${productId}`);
    onClose();
  };

  if (!isOpen) return null;

  const displayedCategories = allCategories.slice(0, 5);
  const displayedFeaturedProducts = featuredProducts.slice(0, 4);
  const hasNoResults = showResults && !isSearching && searchResults.length === 0 && matchingCategories.length === 0;

  return (
    <div
      ref={dropdownRef}
      className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full mt-2 ${fullWidth ? 'w-full min-w-[300px]' : 'w-[calc(100vw-2rem)] max-w-[400px] md:max-w-[600px]'} bg-white rounded-lg shadow-2xl border border-gray-200 z-[9999]`}
    >
      {/* Search Input - Only show if showInput is true */}
      {showInput && (
        <div className="p-4 border-b border-gray-100">
          <form onSubmit={handleSearch} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder="Search for products, categories and more..."
              className="w-full px-4 py-2.5 pl-10 text-sm border border-gray-300 rounded-lg  bg-gray-50"
              autoComplete="off"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Search Content */}
      <div className="max-h-[60vh] overflow-y-auto">
        {/* Search Results */}
        {showResults && searchQuery.trim().length >= 2 ? (
          <div className="p-4">
            {matchingCategories.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {matchingCategories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => handleCategoryClick(category._id)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-900 transition-colors"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {isSearching ? 'Searching...' : `Products (${searchResults.length})`}
            </h3>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {searchResults.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => handleProductClick(product._id)}
                    className="flex flex-col text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  >
                    <div className="relative aspect-square bg-gray-50 rounded overflow-hidden mb-2">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-contain p-1"
                          sizes="150px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-0.5">
                      {product.name}
                    </h4>
                    {product.discountPrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{product.discountPrice.toFixed(0)}
                        </span>
                        <span className="text-xs text-gray-500 line-through">
                          ₹{product.price.toFixed(0)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{product.price.toFixed(0)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : !isSearching ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                No products found for &quot;{searchQuery}&quot;
              </div>
            ) : null}

            {/* No exact matches: surface trending products instead of a dead end */}
            {hasNoResults && displayedFeaturedProducts.length > 0 && (
              <div className="mt-2 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Trending Products
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {displayedFeaturedProducts.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => handleProductClick(product._id)}
                      className="flex flex-col items-center text-center hover:bg-gray-50 px-2 rounded-lg transition-colors"
                    >
                      <div className="relative w-full aspect-square bg-gray-100 rounded overflow-hidden mb-2">
                        {product.images && product.images.length > 0 ? (
                          <Image src={product.images[0]} alt={product.name} fill className="object-contain" sizes="80px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <h4 className="text-xs font-medium text-gray-900 line-clamp-1">{product.name}</h4>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={handleSearch}
                  className="w-full text-center text-sm font-medium text-gray-900 hover:text-gray-600 py-2"
                >
                  View all results for "{searchQuery}" →
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Recent Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleRecentSearchClick(term)}
                      className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-900 transition-colors"
                    >
                      {term}
                      <span
                        onClick={(e) => handleRemoveRecentSearch(e, term)}
                        className="text-gray-400 hover:text-gray-700"
                        aria-label={`Remove "${term}" from recent searches`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Categories */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Popular Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {displayedCategories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => handleCategoryClick(category._id)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-900 transition-colors"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Products */}
            {displayedFeaturedProducts.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Featured Products
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {displayedFeaturedProducts.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => handleProductClick(product._id)}
                      className="flex flex-col items-center text-center hover:bg-gray-50 px-2 rounded-lg transition-colors"
                    >
                      <div className="relative w-28 h-28 bg-gray-100 rounded overflow-hidden mb-2">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {product.discountPrice && (
                          <span className="absolute top-1 left-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                            SALE
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-medium text-gray-900 line-clamp-1 group-hover:text-gray-600">
                        {product.name}
                      </h4>
                      <div className="mt-0.5">
                        {product.discountPrice ? (
                          <span className="text-xs font-semibold text-gray-900">
                            ₹{product.discountPrice.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-gray-900">
                            ₹{product.price.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
