'use client';

import { useEffect, useState, useCallback } from 'react';
import { shopCategoryApi } from '@/lib/api';
import { ShopCategory, CreateShopCategoryDto } from '@/types';

export default function ShopByCategoryManagementPage() {
  const [shopCategories, setShopCategories] = useState<ShopCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShopCategory, setEditingShopCategory] = useState<ShopCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateShopCategoryDto>({
    name: '',
    isActive: true,
    displayOrder: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchShopCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await shopCategoryApi.getAll();
      setShopCategories(res.data || []);
    } catch (err) {
      console.error('Failed to fetch shop categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShopCategories();
  }, [fetchShopCategories]);

  const resetForm = () => {
    setFormData({ name: '', isActive: true, displayOrder: 0 });
    setFormErrors({});
    setEditingShopCategory(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (shopCategory: ShopCategory) => {
    setEditingShopCategory(shopCategory);
    setFormData({
      name: shopCategory.name,
      isActive: shopCategory.isActive,
      displayOrder: shopCategory.displayOrder,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingShopCategory) {
        await shopCategoryApi.update(editingShopCategory._id, formData);
      } else {
        await shopCategoryApi.create(formData);
      }
      closeModal();
      fetchShopCategories();
    } catch (err: unknown) {
      console.error('Failed to save shop category:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setFormErrors({ general: error.response?.data?.message || 'Failed to save category. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await shopCategoryApi.delete(id);
      setDeleteConfirm(null);
      fetchShopCategories();
    } catch (err: unknown) {
      console.error('Failed to delete shop category:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to delete category. Please try again.');
    }
  };

  const handleToggleActive = async (shopCategory: ShopCategory) => {
    try {
      await shopCategoryApi.update(shopCategory._id, { isActive: !shopCategory.isActive });
      fetchShopCategories();
    } catch (err) {
      console.error('Failed to update shop category:', err);
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shop by Category</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage the tabs shown in the homepage &quot;Shop by Category&quot; section. Each tab groups a set of
            subcategory tiles (image + offer text) — map SKUs onto those under{' '}
            <a href="/admin/shop-subcategories" className="underline">
              Shop Subcategories
            </a>
            .
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <span className="text-red-500">&times;</span>
          </button>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : shopCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No categories yet. Add one to populate the homepage &quot;Shop by Category&quot; section.
                  </td>
                </tr>
              ) : (
                shopCategories.map((shopCategory) => (
                  <tr key={shopCategory._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{shopCategory.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{shopCategory.displayOrder}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(shopCategory)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          shopCategory.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {shopCategory.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditModal(shopCategory)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        Edit
                      </button>
                      {deleteConfirm === shopCategory._id ? (
                        <span className="space-x-2">
                          <button onClick={() => handleDelete(shopCategory._id)} className="text-red-600 hover:text-red-900 font-medium">
                            Confirm
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-gray-600 hover:text-gray-900">
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button onClick={() => setDeleteConfirm(shopCategory._id)} className="text-red-600 hover:text-red-900">
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full relative z-50">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[80vh] overflow-y-auto">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {editingShopCategory ? 'Edit Category' : 'Add Category'}
                  </h3>

                  {formErrors.general && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {formErrors.general}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Sneakers"
                        className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                          formErrors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                        <input
                          type="number"
                          value={formData.displayOrder ?? 0}
                          onChange={(e) => setFormData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                          className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive ?? true}
                            onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                            Active
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingShopCategory ? 'Update Category' : 'Create Category'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
