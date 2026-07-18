'use client';

import { useEffect, useState, useCallback } from 'react';
import { reviewApi } from '@/lib/api';
import { Review, CreateReviewDto } from '@/types';

export default function ReviewManagementPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterApproved, setFilterApproved] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateReviewDto>({
    customerName: '',
    location: '',
    rating: 5,
    text: '',
    verifiedPurchase: true,
    productLabel: '',
    isApproved: true,
    displayOnHomepage: false,
    displayOrder: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { limit: 100 };
      if (filterApproved === 'approved') params.isApproved = true;
      if (filterApproved === 'pending') params.isApproved = false;

      const response = await reviewApi.getAll(params);
      const data = response.data;
      setReviews(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filterApproved]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const resetForm = () => {
    setFormData({
      customerName: '',
      location: '',
      rating: 5,
      text: '',
      verifiedPurchase: true,
      productLabel: '',
      isApproved: true,
      displayOnHomepage: false,
      displayOrder: 0,
    });
    setFormErrors({});
    setEditingReview(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (review: Review) => {
    setEditingReview(review);
    setFormData({
      customerName: review.customerName,
      location: review.location || '',
      rating: review.rating,
      text: review.text,
      verifiedPurchase: review.verifiedPurchase,
      productLabel: review.productLabel || '',
      isApproved: review.isApproved,
      displayOnHomepage: review.displayOnHomepage,
      displayOrder: review.displayOrder,
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
    if (!formData.customerName.trim()) errors.customerName = 'Customer name is required';
    if (!formData.text.trim()) errors.text = 'Review text is required';
    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      errors.rating = 'Rating must be between 1 and 5';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingReview) {
        await reviewApi.update(editingReview._id, formData);
      } else {
        await reviewApi.create(formData);
      }
      closeModal();
      fetchReviews();
    } catch (err: unknown) {
      console.error('Failed to save review:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setFormErrors({ general: error.response?.data?.message || 'Failed to save review. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await reviewApi.delete(id);
      setDeleteConfirm(null);
      fetchReviews();
    } catch (err) {
      console.error('Failed to delete review:', err);
      setError('Failed to delete review. Please try again.');
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review Management</h1>
          <p className="mt-2 text-sm text-gray-600">Moderate customer reviews and choose which ones feature on the homepage.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Review
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

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={filterApproved}
            onChange={(e) => setFilterApproved(e.target.value)}
            className="text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Reviews</option>
            <option value="approved">Approved Only</option>
            <option value="pending">Pending Only</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Homepage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No reviews found.</td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{review.customerName}</div>
                      <div className="text-xs text-gray-500">{review.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {'★'.repeat(Math.round(review.rating))}
                      <span className="text-gray-400">{'★'.repeat(5 - Math.round(review.rating))}</span>
                      <span className="ml-1 text-xs text-gray-500">({review.rating})</span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-gray-700 line-clamp-2">{review.text}</div>
                      {review.productLabel && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                          {review.productLabel}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          review.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {review.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {review.displayOnHomepage ? 'Yes' : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button onClick={() => openEditModal(review)} className="text-indigo-600 hover:text-indigo-900">
                          Edit
                        </button>
                        {deleteConfirm === review._id ? (
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleDelete(review._id)} className="text-red-600 hover:text-red-900 font-medium">
                              Confirm
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-gray-600 hover:text-gray-900">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(review._id)} className="text-red-600 hover:text-red-900">
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-50">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {editingReview ? 'Edit Review' : 'Add Review'}
                  </h3>

                  {formErrors.general && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {formErrors.general}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                      <input
                        type="text"
                        value={formData.customerName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
                        className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                          formErrors.customerName ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.customerName && <p className="mt-1 text-sm text-red-600">{formErrors.customerName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={formData.location || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5) *</label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="5"
                        value={formData.rating}
                        onChange={(e) => setFormData((prev) => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
                        className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                          formErrors.rating ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.rating && <p className="mt-1 text-sm text-red-600">{formErrors.rating}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Label</label>
                      <input
                        type="text"
                        value={formData.productLabel || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, productLabel: e.target.value }))}
                        placeholder="e.g. Formal Shirts"
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Review Text *</label>
                      <textarea
                        rows={3}
                        value={formData.text}
                        onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
                        className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                          formErrors.text ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.text && <p className="mt-1 text-sm text-red-600">{formErrors.text}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                      <input
                        type="number"
                        value={formData.displayOrder || 0}
                        onChange={(e) => setFormData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="verifiedPurchase"
                          checked={formData.verifiedPurchase || false}
                          onChange={(e) => setFormData((prev) => ({ ...prev, verifiedPurchase: e.target.checked }))}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="verifiedPurchase" className="ml-2 block text-sm text-gray-900">Verified</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isApproved"
                          checked={formData.isApproved || false}
                          onChange={(e) => setFormData((prev) => ({ ...prev, isApproved: e.target.checked }))}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isApproved" className="ml-2 block text-sm text-gray-900">Approved</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="displayOnHomepage"
                          checked={formData.displayOnHomepage || false}
                          onChange={(e) => setFormData((prev) => ({ ...prev, displayOnHomepage: e.target.checked }))}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="displayOnHomepage" className="ml-2 block text-sm text-gray-900">Homepage</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingReview ? 'Update Review' : 'Create Review'}
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
