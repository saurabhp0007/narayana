'use client';

import { useEffect, useState, useCallback } from 'react';
import { offerApi, productApi, categoryApi } from '@/lib/api';
import { Offer, Product, Category, CreateOfferDto, OfferRules } from '@/types';

type OfferType = 'buyXgetY' | 'bundleDiscount' | 'percentageOff' | 'fixedAmountOff';

export default function OfferManagementPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<string>('all');

  // Cascading selection state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<CreateOfferDto>({
    name: '',
    description: '',
    offerType: 'percentageOff',
    rules: {},
    productIds: [],
    categoryIds: [],
    startDate: '',
    endDate: '',
    isActive: true,
    priority: 0,
    displayInNavbar: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchOffers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {};
      if (filterActive === 'active') params.isActive = true;
      if (filterActive === 'inactive') params.isActive = false;

      const response = await offerApi.getAll(params);
      const data = response.data;
      setOffers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Failed to fetch offers:', err);
      setError('Failed to load offers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filterActive]);

  const fetchSupportData = useCallback(async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productApi.getAll({ limit: 100, isActive: true }),
        categoryApi.getAll({ isActive: true }),
      ]);

      const productsData = productsRes.data;
      setProducts(Array.isArray(productsData) ? productsData : productsData.data || []);

      const categoriesData = categoriesRes.data;
      setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData.data || []);
    } catch (err) {
      console.error('Failed to fetch support data:', err);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
    fetchSupportData();
  }, [fetchOffers, fetchSupportData]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      offerType: 'percentageOff',
      rules: {},
      productIds: [],
      categoryIds: [],
      startDate: '',
      endDate: '',
      isActive: true,
      priority: 0,
      displayInNavbar: false,
    });
    setFormErrors({});
    setEditingOffer(null);
    setSelectedCategory('');
    setFilteredProducts([]);
  };

  // Handle category change - filter products
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setFormData(prev => ({ ...prev, productIds: [], categoryIds: categoryId ? [categoryId] : [] }));

    if (categoryId) {
      const filtered = products.filter(
        prod => (prod.categoryId as Category)?._id === categoryId || prod.categoryId === categoryId
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (offer: Offer) => {
    setEditingOffer(offer);
    const productIdList = (offer.productIds || []).map((p) => (typeof p === 'string' ? p : p._id));
    setFormData({
      name: offer.name,
      description: offer.description || '',
      offerType: offer.offerType,
      rules: offer.rules || {},
      productIds: productIdList,
      categoryIds: offer.categoryIds || [],
      startDate: new Date(offer.startDate).toISOString().slice(0, 16),
      endDate: new Date(offer.endDate).toISOString().slice(0, 16),
      isActive: offer.isActive,
      priority: offer.priority,
      displayInNavbar: offer.displayInNavbar || false,
    });

    // Initialize cascading selection for editing
    if (productIdList.length > 0) {
      // Find the first product to get its category
      const firstProductId = productIdList[0];
      const product = products.find(p => p._id === firstProductId);
      if (product) {
        const categoryId = (product.categoryId as Category)?._id || product.categoryId as string;
        setSelectedCategory(categoryId);
        setFilteredProducts(products.filter(
          prod => (prod.categoryId as Category)?._id === categoryId || prod.categoryId === categoryId
        ));
      }
    } else {
      setSelectedCategory('');
      setFilteredProducts([]);
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      errors.endDate = 'End date must be after start date';
    }

    // Validate rules based on offer type
    switch (formData.offerType) {
      case 'buyXgetY':
        if (!formData.rules.buyQuantity || formData.rules.buyQuantity <= 0) {
          errors.buyQuantity = 'Buy quantity is required';
        }
        if (!formData.rules.getQuantity || formData.rules.getQuantity <= 0) {
          errors.getQuantity = 'Get quantity is required';
        }
        break;
      case 'bundleDiscount':
        if (!formData.rules.bundlePrice || formData.rules.bundlePrice <= 0) {
          errors.bundlePrice = 'Bundle price is required';
        }
        break;
      case 'percentageOff':
        if (!formData.rules.discountPercentage || formData.rules.discountPercentage <= 0 || formData.rules.discountPercentage > 100) {
          errors.discountPercentage = 'Valid discount percentage is required (1-100)';
        }
        break;
      case 'fixedAmountOff':
        if (!formData.rules.discountAmount || formData.rules.discountAmount <= 0) {
          errors.discountAmount = 'Discount amount is required';
        }
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingOffer) {
        await offerApi.update(editingOffer._id, formData);
      } else {
        await offerApi.create(formData);
      }
      closeModal();
      fetchOffers();
    } catch (err: unknown) {
      console.error('Failed to save offer:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setFormErrors({
        general: error.response?.data?.message || 'Failed to save offer. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (offerId: string) => {
    try {
      await offerApi.delete(offerId);
      setDeleteConfirm(null);
      fetchOffers();
    } catch (err) {
      console.error('Failed to delete offer:', err);
      setError('Failed to delete offer. Please try again.');
    }
  };

  const updateRules = (key: keyof OfferRules, value: number) => {
    setFormData((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [key]: value,
      },
    }));
  };

  const getOfferTypeName = (type: string) => {
    const names: Record<string, string> = {
      buyXgetY: 'Buy X Get Y',
      bundleDiscount: 'Bundle Discount',
      percentageOff: 'Percentage Off',
      fixedAmountOff: 'Fixed Amount Off',
    };
    return names[type] || type;
  };

  const getOfferStatus = (offer: Offer) => {
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);

    if (!offer.isActive) return { status: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    if (now < start) return { status: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
    if (now > end) return { status: 'Expired', color: 'bg-red-100 text-red-800' };
    return { status: 'Active', color: 'bg-green-100 text-green-800' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offer Management</h1>
          <p className="mt-2 text-sm text-gray-600">Manage promotional offers and discounts.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Offer
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

      {/* Filter */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Offers</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No offers found.
                  </td>
                </tr>
              ) : (
                offers.map((offer) => {
                  const { status, color } = getOfferStatus(offer);
                  return (
                    <tr key={offer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{offer.name}</div>
                        {offer.description && (
                          <div className="text-xs text-gray-500">{offer.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getOfferTypeName(offer.offerType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(offer.startDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(offer.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {offer.priority}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => openEditModal(offer)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          {deleteConfirm === offer._id ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDelete(offer._id)}
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
                              onClick={() => setDeleteConfirm(offer._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-50">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {editingOffer ? 'Edit Offer' : 'Create New Offer'}
                  </h3>

                  {formErrors.general && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {formErrors.general}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                          formErrors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={formData.description || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        className="w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                      />
                    </div>

                    {/* Offer Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Offer Type *
                      </label>
                      <select
                        value={formData.offerType}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            offerType: e.target.value as OfferType,
                            rules: {},
                          }))
                        }
                        className="text-black w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="buyXgetY">Buy X Get Y</option>
                        <option value="bundleDiscount">Bundle Discount</option>
                        <option value="percentageOff">Percentage Off</option>
                        <option value="fixedAmountOff">Fixed Amount Off</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <input
                        type="number"
                        value={formData.priority || 0}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            priority: parseInt(e.target.value) || 0,
                          }))
                        }
                        min="0"
                        className="text-black w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    {/* Rules based on offer type */}
                    <div className="md:col-span-2 bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Offer Rules</h4>
                      {formData.offerType === 'buyXgetY' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Buy Quantity *
                            </label>
                            <input
                              type="number"
                              value={formData.rules.buyQuantity || ''}
                              onChange={(e) =>
                                updateRules('buyQuantity', parseInt(e.target.value) || 0)
                              }
                              min="1"
                              className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                                formErrors.buyQuantity ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            {formErrors.buyQuantity && (
                              <p className="mt-1 text-xs text-red-600">{formErrors.buyQuantity}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Get Quantity *
                            </label>
                            <input
                              type="number"
                              value={formData.rules.getQuantity || ''}
                              onChange={(e) =>
                                updateRules('getQuantity', parseInt(e.target.value) || 0)
                              }
                              min="1"
                              className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                                formErrors.getQuantity ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            {formErrors.getQuantity && (
                              <p className="mt-1 text-xs text-red-600">{formErrors.getQuantity}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {formData.offerType === 'bundleDiscount' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Bundle Price *
                          </label>
                          <input
                            type="number"
                            value={formData.rules.bundlePrice || ''}
                            onChange={(e) =>
                              updateRules('bundlePrice', parseFloat(e.target.value) || 0)
                            }
                            step="0.01"
                            min="0"
                            className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                              formErrors.bundlePrice ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {formErrors.bundlePrice && (
                            <p className="mt-1 text-xs text-red-600">{formErrors.bundlePrice}</p>
                          )}
                        </div>
                      )}
                      {formData.offerType === 'percentageOff' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Discount Percentage (%) *
                          </label>
                          <input
                            type="number"
                            value={formData.rules.discountPercentage || ''}
                            onChange={(e) =>
                              updateRules('discountPercentage', parseFloat(e.target.value) || 0)
                            }
                            min="1"
                            max="100"
                            className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                              formErrors.discountPercentage ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {formErrors.discountPercentage && (
                            <p className="mt-1 text-xs text-red-600">
                              {formErrors.discountPercentage}
                            </p>
                          )}
                        </div>
                      )}
                      {formData.offerType === 'fixedAmountOff' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Discount Amount *
                          </label>
                          <input
                            type="number"
                            value={formData.rules.discountAmount || ''}
                            onChange={(e) =>
                              updateRules('discountAmount', parseFloat(e.target.value) || 0)
                            }
                            step="0.01"
                            min="0"
                            className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                              formErrors.discountAmount ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {formErrors.discountAmount && (
                            <p className="mt-1 text-xs text-red-600">{formErrors.discountAmount}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Cascading Selection: Category -> Products */}
                    <div className="md:col-span-2 bg-green-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Product Selection (Cascading)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Category Selection */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            1. Select Category *
                          </label>
                          <select
                            value={selectedCategory}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">-- Choose Category --</option>
                            {categories.map((category) => (
                              <option key={category._id} value={category._id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Products Selection */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            2. Select Products * ({formData.productIds?.length || 0} selected)
                          </label>
                          <select
                            multiple
                            value={formData.productIds || []}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                productIds: Array.from(e.target.selectedOptions, (opt) => opt.value),
                              }))
                            }
                            disabled={!selectedCategory}
                            className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-32 disabled:bg-gray-100"
                          >
                            {filteredProducts.map((product) => (
                              <option key={product._id} value={product._id}>
                                {product.name} - ₹{product.discountPrice || product.price}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple products</p>
                        </div>
                      </div>
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                        className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                          formErrors.startDate ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.startDate && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>
                      )}
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                        }
                        className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                          formErrors.endDate ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.endDate && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
                      )}
                    </div>

                    {/* Is Active */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActiveOffer"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActiveOffer" className="ml-2 block text-sm text-gray-900">
                        Offer is Active
                      </label>
                    </div>

                    {/* Display In Navbar */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="displayInNavbar"
                        checked={formData.displayInNavbar || false}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, displayInNavbar: e.target.checked }))
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="displayInNavbar" className="ml-2 block text-sm text-gray-900">
                        Display in Navbar Dropdown
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingOffer ? 'Update Offer' : 'Create Offer'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
