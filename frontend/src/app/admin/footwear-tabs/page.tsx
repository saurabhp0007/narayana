'use client';

import { useState, useEffect } from 'react';
import { footwearTabApi, offerApi, productApi } from '@/lib/api';
import { FootwearTabItem, CreateFootwearTabDto, Offer, Product, OfferRules } from '@/types';

type DiscountType = 'none' | 'percentageOff' | 'fixedAmountOff' | 'bundleDiscount' | 'buyXgetY';

interface MappingFormState {
  productId: string;
  name: string;
  discountType: DiscountType;
  rules: OfferRules;
  isActive: boolean;
}

const EMPTY_MAPPING_FORM: MappingFormState = {
  productId: '',
  name: '',
  discountType: 'none',
  rules: {},
  isActive: true,
};

export default function FootwearTabManagementPage() {
  const [tabs, setTabs] = useState<FootwearTabItem[]>([]);
  const [offersByTabId, setOffersByTabId] = useState<Record<string, Offer[]>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTab, setEditingTab] = useState<FootwearTabItem | null>(null);
  const [formData, setFormData] = useState<CreateFootwearTabDto>({
    name: '',
    displayOrder: 0,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Product mapping modal (add/edit which product represents a card in a tab)
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [mappingTab, setMappingTab] = useState<FootwearTabItem | null>(null);
  const [mappingOffer, setMappingOffer] = useState<Offer | null>(null);
  const [mappingForm, setMappingForm] = useState<MappingFormState>(EMPTY_MAPPING_FORM);
  const [isMappingSubmitting, setIsMappingSubmitting] = useState(false);
  const [mappingError, setMappingError] = useState<string | null>(null);
  const [removeConfirmOfferId, setRemoveConfirmOfferId] = useState<string | null>(null);

  const fetchTabs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await footwearTabApi.getAll();
      const data = response.data;
      setTabs(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Failed to fetch footwear tabs:', err);
      setError('Failed to load footwear tabs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // All offers with a tab assigned (not just active/in-range ones, unlike the public
  // homepage feed) so admins can see and edit scheduled/inactive mappings too.
  const fetchMappedOffers = async () => {
    try {
      const response = await offerApi.getAll({ limit: 500 });
      const data = response.data;
      const offers: Offer[] = Array.isArray(data) ? data : data.data || [];
      const grouped: Record<string, Offer[]> = {};
      for (const offer of offers) {
        const tab = offer.footwearTabId;
        if (!tab) continue;
        const tabId = typeof tab === 'string' ? tab : tab._id;
        (grouped[tabId] ||= []).push(offer);
      }
      setOffersByTabId(grouped);
    } catch (err) {
      console.error('Failed to fetch mapped offers:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productApi.getAll({ isActive: true, limit: 200 });
      const data = response.data;
      setProducts(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const getMappedProductId = (offer: Offer): string => {
    const first = offer.productIds?.[0];
    if (!first) return '';
    return typeof first === 'string' ? first : first._id;
  };

  const getProductName = (productId: string) => products.find((p) => p._id === productId)?.name;

  useEffect(() => {
    fetchTabs();
    fetchMappedOffers();
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingTab(null);
    setFormData({ name: '', displayOrder: tabs.length, isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (tab: FootwearTabItem) => {
    setEditingTab(tab);
    setFormData({ name: tab.name, displayOrder: tab.displayOrder, isActive: tab.isActive });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTab(null);
    setFormData({ name: '', displayOrder: 0, isActive: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingTab) {
        await footwearTabApi.update(editingTab._id, formData);
        setSuccessMessage('Footwear tab updated successfully!');
      } else {
        await footwearTabApi.create(formData);
        setSuccessMessage('Footwear tab created successfully!');
      }

      closeModal();
      fetchTabs();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to save footwear tab. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      await footwearTabApi.delete(id);
      setSuccessMessage('Footwear tab deleted successfully!');
      setDeleteConfirmId(null);
      fetchTabs();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to delete footwear tab. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (tab: FootwearTabItem) => {
    setError(null);
    try {
      await footwearTabApi.update(tab._id, { isActive: !tab.isActive });
      fetchTabs();
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update status. Please try again.');
    }
  };

  const openAddMapping = (tab: FootwearTabItem) => {
    setMappingTab(tab);
    setMappingOffer(null);
    setMappingForm(EMPTY_MAPPING_FORM);
    setMappingError(null);
    setIsMappingModalOpen(true);
  };

  const openEditMapping = (tab: FootwearTabItem, offer: Offer) => {
    const rules = offer.rules || {};
    let discountType: DiscountType = 'none';
    if (offer.offerType === 'percentageOff' && rules.discountPercentage) discountType = 'percentageOff';
    else if (offer.offerType === 'fixedAmountOff' && rules.discountAmount) discountType = 'fixedAmountOff';
    else if (offer.offerType === 'bundleDiscount' && rules.bundlePrice && rules.minQuantity) discountType = 'bundleDiscount';
    else if (offer.offerType === 'buyXgetY' && rules.buyQuantity && rules.getQuantity) discountType = 'buyXgetY';

    setMappingTab(tab);
    setMappingOffer(offer);
    setMappingForm({
      productId: getMappedProductId(offer),
      name: offer.name,
      discountType,
      rules,
      isActive: offer.isActive,
    });
    setMappingError(null);
    setIsMappingModalOpen(true);
  };

  const closeMappingModal = () => {
    setIsMappingModalOpen(false);
    setMappingTab(null);
    setMappingOffer(null);
    setMappingForm(EMPTY_MAPPING_FORM);
    setMappingError(null);
  };

  const updateMappingRule = (key: keyof OfferRules, value: number) => {
    setMappingForm((prev) => ({ ...prev, rules: { ...prev.rules, [key]: value } }));
  };

  const handleMappingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mappingForm.productId) {
      setMappingError('Select a product');
      return;
    }
    if (!mappingForm.name.trim()) {
      setMappingError('Name is required');
      return;
    }

    setIsMappingSubmitting(true);
    setMappingError(null);

    const offerType = mappingForm.discountType === 'none' ? 'percentageOff' : mappingForm.discountType;
    const rules = mappingForm.discountType === 'none' ? {} : mappingForm.rules;

    try {
      if (mappingOffer) {
        await offerApi.update(mappingOffer._id, {
          name: mappingForm.name,
          offerType,
          rules,
          productIds: [mappingForm.productId],
          isActive: mappingForm.isActive,
        });
        setSuccessMessage('Product mapping updated!');
      } else if (mappingTab) {
        const now = new Date();
        const farFuture = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        await offerApi.create({
          name: mappingForm.name,
          offerType,
          rules,
          productIds: [mappingForm.productId],
          footwearTabId: mappingTab._id,
          startDate: now.toISOString(),
          endDate: farFuture.toISOString(),
          isActive: mappingForm.isActive,
          priority: 1,
        });
        setSuccessMessage('Product added to tab!');
      }

      closeMappingModal();
      fetchMappedOffers();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMappingError(error.response?.data?.message || 'Failed to save product mapping. Please try again.');
    } finally {
      setIsMappingSubmitting(false);
    }
  };

  const handleRemoveMapping = async (offer: Offer) => {
    setError(null);
    try {
      await offerApi.update(offer._id, { footwearTabId: null });
      setRemoveConfirmOfferId(null);
      fetchMappedOffers();
      setSuccessMessage('Product removed from tab.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to remove product mapping:', err);
      setError('Failed to remove product mapping. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Footwear Section Tabs</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage the tabs shown in the homepage Footwear section (e.g. Deals &amp; Combos, Men&apos;s Shoes). Offers
            are assigned to a tab from the Offers page.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Create New Tab
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
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
                  Display Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mapped Products
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
              {tabs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No footwear tabs yet. Create one to start assigning offers to it.
                  </td>
                </tr>
              ) : (
                tabs.map((tab) => {
                  const mappedOffers = offersByTabId[tab._id] || [];
                  return (
                  <tr key={tab._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tab.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tab.slug}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tab.displayOrder}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-sm">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {mappedOffers.length === 0 ? (
                          <span className="text-gray-400">No products mapped yet</span>
                        ) : (
                          mappedOffers.map((offer) => {
                            const productName = getProductName(getMappedProductId(offer)) || offer.name;
                            return (
                              <span
                                key={offer._id}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                  offer.isActive ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-400'
                                }`}
                                title={offer.name}
                              >
                                {productName}
                                {!offer.isActive && ' (inactive)'}
                                <button
                                  type="button"
                                  onClick={() => openEditMapping(tab, offer)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Edit mapping"
                                >
                                  ✎
                                </button>
                                {removeConfirmOfferId === offer._id ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMapping(offer)}
                                      className="text-red-600 hover:text-red-900 font-medium"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setRemoveConfirmOfferId(null)}
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setRemoveConfirmOfferId(offer._id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Remove from tab"
                                  >
                                    ×
                                  </button>
                                )}
                              </span>
                            );
                          })
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => openAddMapping(tab)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-900"
                      >
                        + Add Product
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(tab)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tab.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {tab.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(tab)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      {deleteConfirmId === tab._id ? (
                        <span className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(tab._id)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button onClick={() => setDeleteConfirmId(null)} className="text-gray-600 hover:text-gray-900">
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(tab._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingTab ? 'Edit Footwear Tab' : 'Create New Footwear Tab'}
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Deals & Combos, Men's Shoes"
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
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))
                    }
                    className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Lower numbers appear first, left to right.</p>
                </div>
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
                  {isSubmitting ? 'Saving...' : editingTab ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMappingModalOpen && mappingTab && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {mappingOffer ? 'Edit Product Mapping' : 'Add Product'} — {mappingTab.name}
              </h3>
            </div>
            <form onSubmit={handleMappingSubmit}>
              <div className="px-6 py-4 space-y-4">
                {mappingError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {mappingError}
                  </div>
                )}

                <div>
                  <label htmlFor="mappingProduct" className="block text-sm font-medium text-gray-700">
                    Product *
                  </label>
                  <select
                    id="mappingProduct"
                    required
                    value={mappingForm.productId}
                    onChange={(e) => {
                      const productId = e.target.value;
                      const product = products.find((p) => p._id === productId);
                      setMappingForm((prev) => ({
                        ...prev,
                        productId,
                        name: product ? product.name : prev.name,
                      }));
                    }}
                    className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} - ₹{product.discountPrice || product.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="mappingName" className="block text-sm font-medium text-gray-700">
                    Offer Name *
                  </label>
                  <input
                    type="text"
                    id="mappingName"
                    required
                    value={mappingForm.name}
                    onChange={(e) => setMappingForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="mappingDiscountType" className="block text-sm font-medium text-gray-700">
                    Discount (optional)
                  </label>
                  <select
                    id="mappingDiscountType"
                    value={mappingForm.discountType}
                    onChange={(e) =>
                      setMappingForm((prev) => ({
                        ...prev,
                        discountType: e.target.value as DiscountType,
                        rules: {},
                      }))
                    }
                    className="text-black mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="none">None — just show the product &amp; badge</option>
                    <option value="percentageOff">Percentage Off</option>
                    <option value="fixedAmountOff">Fixed Amount Off</option>
                    <option value="bundleDiscount">Bundle Discount</option>
                    <option value="buyXgetY">Buy X Get Y</option>
                  </select>
                </div>

                {mappingForm.discountType === 'percentageOff' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Discount Percentage (%) *</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={mappingForm.rules.discountPercentage || ''}
                      onChange={(e) => updateMappingRule('discountPercentage', parseFloat(e.target.value) || 0)}
                      className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}

                {mappingForm.discountType === 'fixedAmountOff' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Discount Amount (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={mappingForm.rules.discountAmount || ''}
                      onChange={(e) => updateMappingRule('discountAmount', parseFloat(e.target.value) || 0)}
                      className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}

                {mappingForm.discountType === 'bundleDiscount' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Min Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        value={mappingForm.rules.minQuantity || ''}
                        onChange={(e) => updateMappingRule('minQuantity', parseInt(e.target.value) || 0)}
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bundle Price (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={mappingForm.rules.bundlePrice || ''}
                        onChange={(e) => updateMappingRule('bundlePrice', parseFloat(e.target.value) || 0)}
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {mappingForm.discountType === 'buyXgetY' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Buy Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        value={mappingForm.rules.buyQuantity || ''}
                        onChange={(e) => updateMappingRule('buyQuantity', parseInt(e.target.value) || 0)}
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Get Quantity Free *</label>
                      <input
                        type="number"
                        min="1"
                        value={mappingForm.rules.getQuantity || ''}
                        onChange={(e) => updateMappingRule('getQuantity', parseInt(e.target.value) || 0)}
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="mappingActive"
                    checked={mappingForm.isActive}
                    onChange={(e) => setMappingForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="mappingActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>

                {!mappingOffer && (
                  <p className="text-xs text-gray-500">
                    Runs for 1 year from today. For custom dates or category-wide targeting, use the{' '}
                    <a href="/admin/offers" className="underline">
                      Offers
                    </a>{' '}
                    page instead.
                  </p>
                )}
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={closeMappingModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMappingSubmitting}
                  className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMappingSubmitting ? 'Saving...' : mappingOffer ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
