'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { productApi, categoryApi, genderApi } from '@/lib/api';
import { Product, Category, Gender, PaginatedResponse } from '@/types';

export default function CategoryMappingPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [mappedCount, setMappedCount] = useState<number>(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapping, setIsMapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const limit = 10;

  // Pending selection to map into the selected category (persists across pages/search)
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  const fetchFilters = useCallback(async () => {
    try {
      const [gendersRes, categoriesRes] = await Promise.all([
        genderApi.getAll({ isActive: true }),
        categoryApi.getAll({ isActive: true, limit: 100 }),
      ]);
      setGenders(Array.isArray(gendersRes.data) ? gendersRes.data : gendersRes.data.data || []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch filters:', err);
      setError('Failed to load categories. Please try again.');
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  const fetchMappedCount = useCallback(async () => {
    if (!selectedCategoryId) {
      setMappedCount(0);
      return;
    }
    try {
      const response = await productApi.getAll({ categoryId: selectedCategoryId, limit: 1 });
      const data = response.data as PaginatedResponse<Product> | Product[];
      setMappedCount('pagination' in data ? data.pagination.total : data.length);
    } catch (err) {
      console.error('Failed to fetch mapped count:', err);
    }
  }, [selectedCategoryId]);

  const fetchProducts = useCallback(async () => {
    if (!selectedCategoryId) {
      setProducts([]);
      setTotalPages(1);
      setTotalProducts(0);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        limit,
        isActive: true,
      };
      if (selectedGender) params.genderId = selectedGender;
      if (searchQuery) params.search = searchQuery;

      const response = await productApi.getAll(params);
      const data = response.data as PaginatedResponse<Product> | Product[];

      if ('pagination' in data) {
        setProducts(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalProducts(data.pagination.total);
      } else {
        setProducts(data);
        setTotalPages(1);
        setTotalProducts(data.length);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategoryId, currentPage, selectedGender, searchQuery]);

  useEffect(() => {
    fetchMappedCount();
  }, [fetchMappedCount]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedProductIds(new Set());
    setCurrentPage(1);
    setSuccessMessage(null);
  };

  const getCategoryIdOf = (product: Product) =>
    typeof product.categoryId === 'string' ? product.categoryId : product.categoryId._id;

  const getCategoryName = (categoryId: Category | string) => {
    if (typeof categoryId === 'object') return categoryId.name;
    const category = categories.find((c) => c._id === categoryId);
    return category?.name || 'Unknown';
  };

  const getGenderName = (genderId: Gender | string) => {
    if (typeof genderId === 'object') return genderId.name;
    const gender = genders.find((g) => g._id === genderId);
    return gender?.name || 'Unknown';
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const selectedCategory = useMemo(
    () => categories.find((c) => c._id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const handleMapSelected = async () => {
    if (!selectedCategoryId || selectedProductIds.size === 0) return;
    setIsMapping(true);
    setError(null);
    try {
      await Promise.all(
        Array.from(selectedProductIds).map((id) =>
          productApi.update(id, { categoryId: selectedCategoryId })
        )
      );
      setSuccessMessage(
        `Mapped ${selectedProductIds.size} SKU${selectedProductIds.size > 1 ? 's' : ''} to ${selectedCategory?.name || 'category'}.`
      );
      setSelectedProductIds(new Set());
      await Promise.all([fetchProducts(), fetchMappedCount()]);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to map selected SKUs.'
        : 'Failed to map selected SKUs.';
      setError(errorMessage);
    } finally {
      setIsMapping(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Category-wise SKU Mapping</h1>
        <p className="mt-2 text-sm text-gray-600">
          Pick a category from Category Management, then assign SKUs to it. A SKU always belongs to
          exactly one category — mapping it here moves it out of any other category it was in.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <span className="text-red-500">&times;</span>
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {successMessage}
        </div>
      )}

      {/* Category picker */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          id="category"
          value={selectedCategoryId}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="text-black w-full md:w-96 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select a category...</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name} ({getGenderName(category.genderId)})
            </option>
          ))}
        </select>
        {selectedCategoryId && (
          <p className="mt-2 text-sm text-gray-600">
            Currently mapped: <span className="font-medium">{mappedCount}</span> SKU
            {mappedCount === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {selectedCategoryId && (
        <>
          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search by Name / SKU
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search products..."
                  className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  id="gender"
                  value={selectedGender}
                  onChange={(e) => {
                    setSelectedGender(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Genders</option>
                  {genders.map((gender) => (
                    <option key={gender._id} value={gender._id}>
                      {gender.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Products table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {selectedProductIds.size > 0
                  ? `${selectedProductIds.size} SKU${selectedProductIds.size > 1 ? 's' : ''} selected`
                  : 'Select SKUs below to map them to this category'}
              </p>
              <button
                onClick={handleMapSelected}
                disabled={selectedProductIds.size === 0 || isMapping}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMapping
                  ? 'Mapping...'
                  : `Map ${selectedProductIds.size || ''} SKU${selectedProductIds.size === 1 ? '' : 's'} to ${selectedCategory?.name || 'category'}`}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Category
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => {
                      const alreadyMapped = getCategoryIdOf(product) === selectedCategoryId;
                      return (
                        <tr key={product._id} className={`hover:bg-gray-50 ${alreadyMapped ? 'bg-indigo-50/50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={alreadyMapped || selectedProductIds.has(product._id)}
                              disabled={alreadyMapped}
                              onChange={() => toggleProduct(product._id)}
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-60"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.images && product.images.length > 0 ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="rounded object-cover"
                              />
                            ) : (
                              <div className="w-[40px] h-[40px] bg-gray-200 rounded" />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {alreadyMapped ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                Already mapped
                              </span>
                            ) : (
                              <span className="text-sm text-gray-600">{getCategoryName(product.categoryId)}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span> ({totalProducts} total)
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
