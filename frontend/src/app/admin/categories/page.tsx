'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { categoryApi, genderApi } from '@/lib/api';
import { Category, Gender, CreateCategoryDto } from '@/types';

const MAX_LATEST_ARRIVALS = 4;

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [latestArrivalsIds, setLatestArrivalsIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter state
  const [filterGenderId, setFilterGenderId] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CreateCategoryDto>({
    name: '',
    slug: '',
    genderId: '',
    isActive: true,
    tabGroup: '',
    tileLabel: '',
    displayOrder: 0,
    showInLatestArrivals: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const fetchGenders = async () => {
    try {
      const response = await genderApi.getAll({ isActive: true });
      if (response.data.data) {
        setGenders(response.data.data);
      } else {
        setGenders(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch genders:', err);
    }
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: { page: number; limit: number; genderId?: string } = {
        page: currentPage,
        limit,
      };
      if (filterGenderId) {
        params.genderId = filterGenderId;
      }

      const response = await categoryApi.getAll(params);
      if (response.data.pagination) {
        setCategories(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.total);
      } else {
        setCategories(response.data);
        setTotalPages(1);
        setTotalItems(response.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLatestArrivals = async () => {
    try {
      const response = await categoryApi.getLatestArrivals();
      const data: Category[] = response.data.data || response.data || [];
      setLatestArrivalsIds(data.map((c) => c._id));
    } catch (err) {
      console.error('Failed to fetch latest arrivals categories:', err);
    }
  };

  useEffect(() => {
    fetchGenders();
    fetchLatestArrivals();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [currentPage, filterGenderId]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      genderId: genders.length > 0 ? genders[0]._id : '',
      isActive: true,
      tabGroup: '',
      tileLabel: '',
      displayOrder: 0,
      showInLatestArrivals: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    const genderId = typeof category.genderId === 'string' ? category.genderId : category.genderId._id;
    setFormData({
      name: category.name,
      slug: category.slug,
      genderId,
      isActive: category.isActive,
      tabGroup: category.tabGroup || '',
      tileLabel: category.tileLabel || '',
      displayOrder: category.displayOrder || 0,
      showInLatestArrivals: category.showInLatestArrivals || false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      genderId: '',
      isActive: true,
      tabGroup: '',
      tileLabel: '',
      displayOrder: 0,
      showInLatestArrivals: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.genderId) {
      setError('Please select a gender.');
      setIsSubmitting(false);
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
      };

      if (editingCategory) {
        await categoryApi.update(editingCategory._id, dataToSubmit);
        setSuccessMessage('Category updated successfully!');
      } else {
        await categoryApi.create(dataToSubmit);
        setSuccessMessage('Category created successfully!');
      }

      closeModal();
      fetchCategories();
      fetchLatestArrivals();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : err instanceof Error ? err.message : 'Failed to save category. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      await categoryApi.delete(id);
      setSuccessMessage('Category deleted successfully!');
      setDeleteConfirmId(null);
      fetchCategories();
      fetchLatestArrivals();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category. Please try again.';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (category: Category) => {
    setError(null);

    try {
      await categoryApi.update(category._id, { isActive: !category.isActive });
      setSuccessMessage(`Category ${!category.isActive ? 'activated' : 'deactivated'} successfully!`);
      fetchCategories();
      fetchLatestArrivals();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status. Please try again.';
      setError(errorMessage);
    }
  };

  const getGenderName = (genderId: Gender | string) => {
    if (typeof genderId === 'string') {
      const gender = genders.find(g => g._id === genderId);
      return gender ? gender.name : 'Unknown';
    }
    return genderId.name;
  };

  const isLatestArrivalsAtCapacity =
    latestArrivalsIds.length >= MAX_LATEST_ARRIVALS &&
    !(editingCategory && latestArrivalsIds.includes(editingCategory._id));

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage product categories for your store
          </p>
          <p className="mt-1 text-sm text-gray-600">
            <span className="font-medium text-gray-900">{latestArrivalsIds.length}/{MAX_LATEST_ARRIVALS}</span> categories shown in homepage Latest Arrivals
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Create New Category
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <label htmlFor="filterGender" className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Gender
        </label>
        <select
          id="filterGender"
          value={filterGenderId}
          onChange={(e) => {
            setFilterGenderId(e.target.value);
            setCurrentPage(1);
          }}
          className="block w-full max-w-xs border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
        >
          <option value="">All Genders</option>
          {genders.map((gender) => (
            <option key={gender._id} value={gender._id}>
              {gender.name}
            </option>
          ))}
        </select>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No categories found. Create your first category to get started.
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.slug}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getGenderName(category.genderId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(category)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              category.isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {category.isActive ? 'Active' : 'Inactive'}
                          </button>
                          {category.showInLatestArrivals && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              Live on Homepage
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(category)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(category._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Shirts, Pants, Dresses"
                  />
                </div>
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                    Slug
                  </label>
                  <input
                    type="text"
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Auto-generated if empty"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    URL-friendly identifier. Will be auto-generated from name if left empty.
                  </p>
                </div>
                <div>
                  <label htmlFor="genderId" className="block text-sm font-medium text-gray-700">
                    Gender *
                  </label>
                  <select
                    id="genderId"
                    required
                    value={formData.genderId}
                    onChange={(e) => setFormData(prev => ({ ...prev, genderId: e.target.value }))}
                    className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a gender</option>
                    {genders.map((gender) => (
                      <option key={gender._id} value={gender._id}>
                        {gender.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="tabGroup" className="block text-sm font-medium text-gray-700">
                    Homepage Tab Group
                  </label>
                  <input
                    type="text"
                    id="tabGroup"
                    value={formData.tabGroup || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tabGroup: e.target.value }))}
                    className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., footwear, shop-by-category"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Groups this category into a homepage tab section (e.g. the Footwear or Shop by Category tabs).
                  </p>
                </div>
                <div>
                  <label htmlFor="tileLabel" className="block text-sm font-medium text-gray-700">
                    Tile Label
                  </label>
                  <input
                    type="text"
                    id="tileLabel"
                    value={formData.tileLabel || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tileLabel: e.target.value }))}
                    className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Limited Sale, Premium, Combo"
                  />
                </div>
                <div>
                  <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700">
                    Display Order
                  </label>
                  <input
                    type="number"
                    id="displayOrder"
                    value={formData.displayOrder ?? 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                    className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showInLatestArrivals"
                      checked={formData.showInLatestArrivals || false}
                      disabled={isLatestArrivalsAtCapacity && !formData.showInLatestArrivals}
                      onChange={(e) => setFormData(prev => ({ ...prev, showInLatestArrivals: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <label htmlFor="showInLatestArrivals" className="ml-2 block text-sm text-gray-900">
                      Show in Latest Arrivals (Homepage)
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Featured as an auto-sliding category card in the homepage &quot;Latest Arrivals&quot; section.
                  </p>
                  {isLatestArrivalsAtCapacity && !formData.showInLatestArrivals && (
                    <p className="mt-1 text-xs text-amber-600">
                      {MAX_LATEST_ARRIVALS} categories are already featured. Turn one off before enabling another.
                    </p>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this category? This action cannot be undone and may affect related products.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
