'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { productApi, genderApi, categoryApi } from '@/lib/api';
import { Product, Gender, Category, PaginatedResponse } from '@/types';

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const limit = 10;

  // Stock update
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [newStock, setNewStock] = useState<number>(0);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        limit,
      };
      if (selectedGender) params.genderId = selectedGender;
      if (selectedCategory) params.categoryId = selectedCategory;
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
  }, [currentPage, selectedGender, selectedCategory, searchQuery]);

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
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleStockUpdate = async (productId: string) => {
    try {
      await productApi.updateStock(productId, newStock);
      setEditingStock(null);
      fetchProducts();
    } catch (err) {
      console.error('Failed to update stock:', err);
      setError('Failed to update stock. Please try again.');
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await productApi.delete(productId);
      setDeleteConfirm(null);
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      setError('Failed to delete product. Please try again.');
    }
  };

  const filteredCategories = selectedGender
    ? categories.filter(
        (cat) =>
          (typeof cat.genderId === 'string' ? cat.genderId : cat.genderId._id) === selectedGender
      )
    : categories;

  const getGenderName = (genderId: Gender | string) => {
    if (typeof genderId === 'object') return genderId.name;
    const gender = genders.find((g) => g._id === genderId);
    return gender?.name || 'Unknown';
  };

  const getCategoryName = (categoryId: Category | string) => {
    if (typeof categoryId === 'object') return categoryId.name;
    const category = categories.find((c) => c._id === categoryId);
    return category?.name || 'Unknown';
  };

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your product catalog. Total products: {totalProducts}
          </p>
        </div>
        <Link
          href="/admin/products/create"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shrink-0"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Product
        </Link>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="text-red-500">&times;</span>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-5">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <div>
            <label htmlFor="search" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Search by Name
            </label>
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search products..."
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <label htmlFor="gender" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Gender
            </label>
            <select
              id="gender"
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setSelectedCategory('');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="">All Genders</option>
              {genders.map((gender) => (
                <option key={gender._id} value={gender._id}>
                  {gender.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Category
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="">All Categories</option>
              {filteredCategories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-gray-200">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No products found.</div>
          ) : (
            products.map((product) => (
              <div key={product._id} className="p-4">
                <div className="flex items-start gap-3">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={56}
                      height={56}
                      className="rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-200 rounded flex items-center justify-center shrink-0">
                      <svg
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {getGenderName(product.genderId)} / {getCategoryName(product.categoryId)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">SKU: {product.sku}</p>
                      </div>
                      <span
                        className={`shrink-0 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  {product.discountPrice ? (
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-900">₹{product.discountPrice.toFixed(2)}</span>
                      <span className="text-xs text-gray-400 line-through">₹{product.price.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="font-semibold text-gray-900">₹{product.price.toFixed(2)}</div>
                  )}

                  {editingStock === product._id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={newStock}
                        onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                      />
                      <button
                        onClick={() => handleStockUpdate(product._id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setEditingStock(null)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setEditingStock(product._id);
                        setNewStock(product.stock);
                      }}
                      className={`cursor-pointer font-medium ${
                        product.stock > 10
                          ? 'text-green-600'
                          : product.stock > 0
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      Stock: {product.stock}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-4 pt-3 border-t border-gray-100 text-sm font-medium">
                  <Link
                    href={`/admin/products/${product._id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </Link>
                  {deleteConfirm === product._id ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(product._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-20 px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="align-middle hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-md object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {getGenderName(product.genderId)} / {getCategoryName(product.categoryId)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-gray-500">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {product.discountPrice ? (
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            ₹{product.discountPrice.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-400 line-through">
                            ₹{product.price.toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm font-semibold text-gray-900">
                          ₹{product.price.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingStock === product._id ? (
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="number"
                            value={newStock}
                            onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            min="0"
                            autoFocus
                          />
                          <button
                            onClick={() => handleStockUpdate(product._id)}
                            className="p-1 rounded text-green-600 hover:bg-green-50 hover:text-green-700"
                            aria-label="Save stock"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditingStock(null)}
                            className="p-1 rounded text-red-600 hover:bg-red-50 hover:text-red-700"
                            aria-label="Cancel"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStock(product._id);
                            setNewStock(product.stock);
                          }}
                          className={`group inline-flex items-center gap-1.5 text-sm font-medium rounded px-1.5 py-0.5 -ml-1.5 hover:bg-gray-100 ${
                            product.stock > 10
                              ? 'text-green-700'
                              : product.stock > 0
                              ? 'text-yellow-700'
                              : 'text-red-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              product.stock > 10
                                ? 'bg-green-500'
                                : product.stock > 0
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                          />
                          {product.stock}
                          <svg
                            className="h-3.5 w-3.5 text-gray-300 opacity-0 group-hover:opacity-100"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/products/${product._id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                        {deleteConfirm === product._id ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(product._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
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
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum =
                      currentPage <= 3
                        ? i + 1
                        : currentPage >= totalPages - 2
                        ? totalPages - 4 + i
                        : currentPage - 2 + i;
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
