'use client';

import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { productApi, footwearSubcategoryApi } from '@/lib/api';
import { Product, Category, PaginatedResponse, FootwearSubcategory } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { useGuestStore } from '@/store/guestStore';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import SearchDropdown from '@/components/common/SearchDropdown';

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const { userType, user } = useAuthStore();
  const { addToCart } = useCartStore();
  const { addToWishlist } = useWishlistStore();
  const { guestId, initGuestSession } = useGuestStore();

  // Use shared data store
  const {
    genders,
    fetchGenders,
    fetchCategoriesByGender,
  } = useDataStore();

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // For non-blocking refresh
  const [error, setError] = useState<string | null>(null);

  // Local filter options (derived from global store)
  const [categories, setCategories] = useState<Category[]>([]);

  // Filter state - use refs to prevent excessive re-renders
  const [selectedGender, setSelectedGender] = useState<string>(
    searchParams.get('genderId') || ''
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('categoryId') || ''
  );
  const [categoryNameFilter, setCategoryNameFilter] = useState<string>(
    searchParams.get('categoryName') || ''
  );
  const [minPrice, setMinPrice] = useState<string>(
    searchParams.get('minPrice') || ''
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    searchParams.get('maxPrice') || ''
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get('search') || ''
  );
  const [currentOfferId, setCurrentOfferId] = useState<string>(
    searchParams.get('offerId') || ''
  );
  const [productIdsFilter, setProductIdsFilter] = useState<string>(
    searchParams.get('productIds') || ''
  );
  const [subcategorySlug, setSubcategorySlug] = useState<string>(
    searchParams.get('subcategorySlug') || ''
  );
  const [subcategoryBanner, setSubcategoryBanner] = useState<FootwearSubcategory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Mobile filter toggle
  const [showFilters, setShowFilters] = useState(false);

  // Loading states for actions
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null);

  // Refs to prevent flickering
  const initialLoadDone = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchParams = useRef<string>('');
  const hasProductsRef = useRef(false);

  // Search dropdown state
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Sync state with URL params when they change (for client-side navigation)
  useEffect(() => {
    const newProductIds = searchParams.get('productIds') || '';
    const newOfferId = searchParams.get('offerId') || '';
    const newGenderId = searchParams.get('genderId') || '';
    const newCategoryId = searchParams.get('categoryId') || '';
    const newCategoryName = searchParams.get('categoryName') || '';
    const newMinPrice = searchParams.get('minPrice') || '';
    const newMaxPrice = searchParams.get('maxPrice') || '';
    const newSearch = searchParams.get('search') || '';
    const newSubcategorySlug = searchParams.get('subcategorySlug') || '';

    // Force refetch by clearing the cache
    lastFetchParams.current = '';

    // Update all state from URL params
    setProductIdsFilter(newProductIds);
    setCurrentOfferId(newOfferId);
    setSelectedGender(newGenderId);
    setSelectedCategory(newCategoryId);
    setCategoryNameFilter(newCategoryName);
    setMinPrice(newMinPrice);
    setMaxPrice(newMaxPrice);
    setSearchQuery(newSearch);
    setSubcategorySlug(newSubcategorySlug);
    if (!newSubcategorySlug) setSubcategoryBanner(null);

    // Reset to page 1 when URL changes
    setCurrentPage(1);
  }, [searchParams]);

  // Fetch filter options ONCE on mount from shared store
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        await fetchGenders();
        initialLoadDone.current = true;
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
        initialLoadDone.current = true;
      }
    };

    fetchFilterOptions();
  }, [fetchGenders]); // Only run once on mount

  // Fetch categories when gender changes (from shared cache)
  useEffect(() => {
    if (!initialLoadDone.current) return;

    const fetchCategories = async () => {
      if (selectedGender) {
        const cats = await fetchCategoriesByGender(selectedGender);
        setCategories(cats);
      } else {
        setCategories([]);
      }
    };

    fetchCategories();
  }, [selectedGender, fetchCategoriesByGender]);

  // Resolve the footwear subcategory (banner + mapped SKUs) when linked in via subcategorySlug
  useEffect(() => {
    if (!subcategorySlug) return;

    let cancelled = false;
    footwearSubcategoryApi
      .getBySlug(subcategorySlug)
      .then((res) => {
        if (cancelled) return;
        const subcategory: FootwearSubcategory = res.data;
        setSubcategoryBanner(subcategory);
        // Backend returns productIds unpopulated (raw ObjectId strings) for this endpoint
        setProductIdsFilter((subcategory.productIds as string[]).join(','));
        setCurrentPage(1);
      })
      .catch((err) => {
        console.error('Failed to load footwear subcategory:', err);
        if (!cancelled) setSubcategoryBanner(null);
      });

    return () => {
      cancelled = true;
    };
  }, [subcategorySlug]);

  // Debounced product fetch to prevent flickering
  const fetchProducts = useCallback(async () => {
    const params: Record<string, unknown> = {
      page: currentPage,
      limit: pagination.limit,
      isActive: true,
    };

    if (selectedGender) params.genderId = selectedGender;
    if (selectedCategory) params.categoryId = selectedCategory;
    if (categoryNameFilter) params.categoryName = categoryNameFilter;
    if (minPrice) params.minPrice = Number(minPrice);
    if (maxPrice) params.maxPrice = Number(maxPrice);
    if (searchQuery) params.search = searchQuery;
    if (productIdsFilter) params.productIds = productIdsFilter;

    // Create a hash of current params to avoid duplicate fetches
    const paramsHash = JSON.stringify(params);
    if (paramsHash === lastFetchParams.current) {
      return; // Skip if same params
    }

    // Use refreshing state if we already have products (prevents flicker)
    if (hasProductsRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await productApi.getAll(params);
      const data = response.data as PaginatedResponse<Product>;

      lastFetchParams.current = paramsHash;
      const newProducts = data.data || [];
      setProducts(newProducts);
      hasProductsRef.current = newProducts.length > 0;
      setPagination(data.pagination || {
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
      });
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [
    currentPage,
    pagination.limit,
    selectedGender,
    selectedCategory,
    categoryNameFilter,
    minPrice,
    maxPrice,
    searchQuery,
    productIdsFilter,
  ]);

  // Debounce product fetching to prevent flickering
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      fetchProducts();
    }, 150); // Slightly longer delay to batch state updates

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchProducts]);

  const handleAddToCart = async (productId: string) => {
    setAddingToCart(productId);
    try {
      if (userType === 'user' && user) {
        await addToCart(productId, 1);
      } else {
        // Guest user - use Redis-based cart
        let currentGuestId = guestId;
        if (!currentGuestId) {
          currentGuestId = await initGuestSession();
        }
        await addToCart(productId, 1, currentGuestId);
      }
      alert('Added to cart successfully!');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleAddToWishlist = async (productId: string) => {
    setAddingToWishlist(productId);
    try {
      if (userType === 'user' && user) {
        await addToWishlist(productId);
      } else {
        // Guest user - use Redis-based wishlist
        let currentGuestId = guestId;
        if (!currentGuestId) {
          currentGuestId = await initGuestSession();
        }
        await addToWishlist(productId, currentGuestId);
      }
      alert('Added to wishlist successfully!');
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
      alert('Failed to add to wishlist. Please try again.');
    } finally {
      setAddingToWishlist(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const clearFilters = () => {
    setSelectedGender('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          {subcategoryBanner ? (
            <div className="mb-8 relative rounded-lg overflow-hidden bg-gray-100">
              {subcategoryBanner.image && (
                <Image
                  src={subcategoryBanner.image}
                  alt={subcategoryBanner.name}
                  width={1200}
                  height={300}
                  className="w-full h-40 md:h-56 object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/30 flex flex-col items-start justify-end p-6">
                {subcategoryBanner.offerText && (
                  <span className="bg-gray-900 text-white text-xs px-2 py-1 rounded font-medium mb-2">
                    {subcategoryBanner.offerText}
                  </span>
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-white">{subcategoryBanner.name}</h1>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Shop</h1>
              <p className="text-sm text-gray-600 mt-1">
                Browse our collection of quality products
              </p>
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-6 relative">
            <div className="flex gap-2">
              <div className="flex-grow relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchDropdown(true)}
                  placeholder="Search products..."
                  className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-md text-sm"
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
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                Search
              </button>
            </div>

            {/* Search Dropdown - No duplicate input, matches parent width */}
            <SearchDropdown
              isOpen={showSearchDropdown}
              onClose={() => setShowSearchDropdown(false)}
              align="left"
              showInput={false}
              fullWidth={true}
              externalQuery={searchQuery}
              onExternalQueryChange={setSearchQuery}
            />
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden w-full mb-4 px-4 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Filter Sidebar */}
            <aside
              className={`${
                showFilters ? 'block' : 'hidden'
              } md:block w-full md:w-64 flex-shrink-0`}
            >
              <div className="bg-white border border-gray-200 rounded-lg p-5 sticky top-24">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Filters</h2>
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-600 hover:text-gray-900 underline"
                  >
                    Clear All
                  </button>
                </div>

                {/* Gender Filter */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={selectedGender}
                    onChange={(e) => {
                      setSelectedGender(e.target.value);
                      setSelectedCategory('');
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  >
                    <option value="">All</option>
                    {genders.map((gender) => (
                      <option key={gender._id} value={gender._id}>
                        {gender.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    >
                      <option value="">All</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Price Range */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-gray-700 mb-2">Price Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                      min="0"
                    />
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                      min="0"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCurrentPage(1);
                    fetchProducts();
                  }}
                  className="w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-grow">
              {/* Refreshing indicator */}
              {isRefreshing && (
                <div className="mb-4 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </div>
                </div>
              )}
              {isLoading && products.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[4/5] bg-gray-100 rounded-lg mb-3"></div>
                      <div className="h-3 bg-gray-100 rounded mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={fetchProducts}
                    className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-gray-600 text-sm mb-4">No products found</p>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-xs text-gray-600">
                    Showing {products.length} of {pagination.total} products
                  </div>

                  <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 transition-opacity duration-200 ${isRefreshing ? 'opacity-60' : 'opacity-100'}`}>
                    {products.map((product) => (
                      <div key={product._id} className="group">
                        {/* Product Image */}
                        <Link href={`/products/${product._id}`} className="block">
                          <div className="relative aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden mb-3">
                            {product.images && product.images.length > 0 ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <svg
                                  className="w-12 h-12"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                            {product.discountPrice && (
                              <span className="absolute top-2 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded font-medium">
                                -{Math.round(
                                  ((product.price - product.discountPrice) /
                                    product.price) *
                                    100
                                )}%
                              </span>
                            )}
                            {/* Quick Action Buttons */}
                            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleAddToWishlist(product._id);
                                }}
                                disabled={addingToWishlist === product._id}
                                className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                                title="Add to Wishlist"
                              >
                                {addingToWishlist === product._id ? (
                                  <svg className="animate-spin h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </Link>

                        {/* Product Info */}
                        <div>
                          <Link href={`/products/${product._id}`}>
                            <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 group-hover:text-gray-600 transition-colors">
                              {product.name}
                            </h3>
                          </Link>

                          {/* Price */}
                          <div className="mb-3">
                            {product.discountPrice ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  ₹{product.discountPrice.toFixed(2)}
                                </span>
                                <span className="text-xs text-gray-500 line-through">
                                  ₹{product.price.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm font-semibold text-gray-900">
                                ₹{product.price.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Add to Cart Button */}
                          <button
                            onClick={() => handleAddToCart(product._id)}
                            disabled={addingToCart === product._id}
                            className="w-full px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                          >
                            {addingToCart === product._id ? (
                              <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-3 w-3" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Adding...
                              </span>
                            ) : (
                              'Add to Cart'
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="mt-10 flex justify-center">
                      <nav className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>

                        {[...Array(pagination.totalPages)].map((_, i) => {
                          const page = i + 1;
                          if (
                            page === 1 ||
                            page === pagination.totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? 'bg-gray-900 text-white'
                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <span key={page} className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}

                        <button
                          onClick={() =>
                            setCurrentPage((p) =>
                              Math.min(pagination.totalPages, p + 1)
                            )
                          }
                          disabled={currentPage === pagination.totalPages}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-900 border-t-transparent"></div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
