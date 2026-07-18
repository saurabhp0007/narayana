'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { collectionApi, productApi } from '@/lib/api';
import { Collection, CreateCollectionDto, Product } from '@/types';
import ImageUploadField from '@/components/common/ImageUploadField';

export default function CollectionManagementPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateCollectionDto>({
    name: '',
    bannerImage: '',
    productIds: [],
    isActive: true,
    displayOrder: 0,
  });
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await collectionApi.getAll();
      setCollections(res.data || []);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
      setError('Failed to load collections. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
    productApi
      .getAll({ isActive: true, limit: 200 })
      .then((res) => setAllProducts(res.data?.data || []))
      .catch((err) => console.error('Failed to fetch products:', err));
  }, [fetchCollections]);

  const resetForm = () => {
    setFormData({ name: '', bannerImage: '', productIds: [], isActive: true, displayOrder: 0 });
    setSelectedProducts([]);
    setProductSearch('');
    setFormErrors({});
    setEditingCollection(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (collection: Collection) => {
    setEditingCollection(collection);
    const products = (collection.productIds as Product[]).filter((p) => typeof p === 'object');
    setFormData({
      name: collection.name,
      bannerImage: collection.bannerImage || '',
      isActive: collection.isActive,
      displayOrder: collection.displayOrder,
    });
    setSelectedProducts(products);
    setProductSearch('');
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
      const payload = { ...formData, productIds: selectedProducts.map((p) => p._id) };
      if (editingCollection) {
        await collectionApi.update(editingCollection._id, payload);
      } else {
        await collectionApi.create(payload);
      }
      closeModal();
      fetchCollections();
    } catch (err: unknown) {
      console.error('Failed to save collection:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setFormErrors({ general: error.response?.data?.message || 'Failed to save collection. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await collectionApi.delete(id);
      setDeleteConfirm(null);
      fetchCollections();
    } catch (err) {
      console.error('Failed to delete collection:', err);
      setError('Failed to delete collection. Please try again.');
    }
  };

  const handleToggleActive = async (collection: Collection) => {
    try {
      await collectionApi.update(collection._id, { isActive: !collection.isActive });
      fetchCollections();
    } catch (err) {
      console.error('Failed to update collection:', err);
    }
  };

  const addProduct = (product: Product) => {
    if (selectedProducts.some((p) => p._id === product._id)) return;
    setSelectedProducts((prev) => [...prev, product]);
    setProductSearch('');
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p._id !== productId));
  };

  const moveProduct = (index: number, direction: -1 | 1) => {
    setSelectedProducts((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const searchResults = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.trim().toLowerCase();
    const selectedIds = new Set(selectedProducts.map((p) => p._id));
    return allProducts
      .filter((p) => !selectedIds.has(p._id) && (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [productSearch, allProducts, selectedProducts]);

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Collections</h1>
          <p className="mt-2 text-sm text-gray-600">
            Curated homepage product showcases — a banner image plus a hand-picked, ordered list of products. Shown
            after &quot;Shop by Category&quot; on the homepage.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Collection
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : collections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No collections yet. Add one to populate the homepage section.
                  </td>
                </tr>
              ) : (
                collections.map((collection) => (
                  <tr key={collection._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {collection.bannerImage ? (
                        <img src={collection.bannerImage} alt={collection.name} className="h-12 w-20 object-cover rounded" />
                      ) : (
                        <div className="h-12 w-20 bg-gray-100 rounded" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{collection.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {(collection.productIds as Product[])?.length || 0} product(s)
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{collection.displayOrder}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(collection)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          collection.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {collection.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditModal(collection)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        Edit
                      </button>
                      {deleteConfirm === collection._id ? (
                        <span className="space-x-2">
                          <button onClick={() => handleDelete(collection._id)} className="text-red-600 hover:text-red-900 font-medium">
                            Confirm
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-gray-600 hover:text-gray-900">
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button onClick={() => setDeleteConfirm(collection._id)} className="text-red-600 hover:text-red-900">
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
                    {editingCollection ? 'Edit Collection' : 'Add Collection'}
                  </h3>

                  {formErrors.general && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {formErrors.general}
                    </div>
                  )}

                  <div className="space-y-4">
                    <ImageUploadField
                      label="Banner Image"
                      value={formData.bannerImage || ''}
                      onChange={(url) => setFormData((prev) => ({ ...prev, bannerImage: url }))}
                      folder="collections"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Bestselling Bags"
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Products</label>
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products by name or SKU..."
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      {searchResults.length > 0 && (
                        <div className="mt-1 border border-gray-200 rounded-md divide-y divide-gray-100 max-h-48 overflow-y-auto">
                          {searchResults.map((product) => (
                            <button
                              type="button"
                              key={product._id}
                              onClick={() => addProduct(product)}
                              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
                            >
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt={product.name} className="h-8 w-8 object-cover rounded" />
                              ) : (
                                <div className="h-8 w-8 bg-gray-100 rounded" />
                              )}
                              <span className="flex-1 text-sm text-gray-900">{product.name}</span>
                              <span className="text-xs text-gray-400">{product.sku}</span>
                              <span className="text-xs font-medium text-indigo-600">+ Add</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {selectedProducts.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {selectedProducts.map((product, index) => (
                            <div key={product._id} className="flex items-center gap-3 border border-gray-200 rounded-md px-3 py-2">
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt={product.name} className="h-10 w-10 object-cover rounded" />
                              ) : (
                                <div className="h-10 w-10 bg-gray-100 rounded" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                <p className="text-xs text-gray-500">₹{(product.discountPrice || product.price).toFixed(0)}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => moveProduct(index, -1)}
                                disabled={index === 0}
                                className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                title="Move up"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => moveProduct(index, 1)}
                                disabled={index === selectedProducts.length - 1}
                                className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                title="Move down"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                onClick={() => removeProduct(product._id)}
                                className="text-red-500 hover:text-red-700 text-sm"
                                title="Remove"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingCollection ? 'Update Collection' : 'Create Collection'}
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
