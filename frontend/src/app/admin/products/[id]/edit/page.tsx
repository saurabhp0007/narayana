'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productApi, genderApi, categoryApi, mediaApi } from '@/lib/api';
import { Gender, Category, Product, ProductBadge, SizeStock } from '@/types';
import SizesAndStockEditor from '@/components/admin/SizesAndStockEditor';

interface FormErrors {
  name?: string;
  genderId?: string;
  categoryId?: string;
  price?: string;
  general?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  genderId: string;
  categoryId: string;
  price: number;
  discountPrice?: number;
  stock: number;
  sizeStock: SizeStock[];
  images: string[];
  isActive: boolean;
  badge?: ProductBadge;
}

// Legacy products have flat `sizes` + an aggregate `stock` but no per-size breakdown.
// Split the aggregate evenly across the existing sizes (remainder on the last one) so
// the total is preserved exactly if the admin saves without touching these rows —
// defaulting every row to 0 instead would silently zero out real stock on save.
function distributeStockAcrossSizes(sizes: string[], totalStock: number): SizeStock[] {
  if (sizes.length === 0) return [];
  const base = Math.floor(totalStock / sizes.length);
  const remainder = totalStock - base * sizes.length;
  return sizes.map((size, i) => ({ size, stock: base + (i < remainder ? 1 : 0) }));
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [notFound, setNotFound] = useState(false);

  // Form data
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    genderId: '',
    categoryId: '',
    price: 0,
    discountPrice: undefined,
    stock: 0,
    sizeStock: [],
    images: [],
    isActive: true,
  });

  // Filter data
  const [genders, setGenders] = useState<Gender[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  const [imageInput, setImageInput] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch filter options and product data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gendersRes, categoriesRes, productRes] = await Promise.all([
          genderApi.getAll({ isActive: true }),
          categoryApi.getAll({ isActive: true }),
          productApi.getById(productId),
        ]);

        setGenders(Array.isArray(gendersRes.data) ? gendersRes.data : gendersRes.data.data || []);
        setCategories(
          Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data.data || []
        );

        const product: Product = productRes.data;

        // Extract IDs from populated objects if necessary
        const genderId =
          typeof product.genderId === 'string' ? product.genderId : product.genderId._id;
        const categoryId =
          typeof product.categoryId === 'string' ? product.categoryId : product.categoryId._id;

        const sizeStock =
          product.sizeStock && product.sizeStock.length > 0
            ? product.sizeStock
            : distributeStockAcrossSizes(product.sizes || [], product.stock);

        setFormData({
          name: product.name,
          description: product.description || '',
          genderId,
          categoryId,
          price: product.price,
          discountPrice: product.discountPrice,
          stock: product.stock,
          sizeStock,
          images: product.images || [],
          isActive: product.isActive,
          badge: product.badge,
        });
      } catch (err) {
        console.error('Failed to fetch data:', err);
        const error = err as { response?: { status?: number } };
        if (error.response?.status === 404) {
          setNotFound(true);
        } else {
          setErrors({ general: 'Failed to load product data. Please refresh the page.' });
        }
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [productId]);

  // Filter categories based on selected gender
  useEffect(() => {
    if (formData.genderId && categories.length > 0) {
      const filtered = categories.filter(
        (cat) =>
          (typeof cat.genderId === 'string' ? cat.genderId : cat.genderId._id) === formData.genderId
      );
      setFilteredCategories(filtered);
      if (!filtered.find((cat) => cat._id === formData.categoryId)) {
        setFormData((prev) => ({ ...prev, categoryId: '' }));
      }
    } else {
      setFilteredCategories([]);
    }
  }, [formData.genderId, categories, formData.categoryId]);

  const sizeStockTotal = formData.sizeStock.reduce((sum, s) => sum + s.stock, 0);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.genderId) {
      newErrors.genderId = 'Gender is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const dataToSubmit = {
        ...formData,
        discountPrice: formData.discountPrice || undefined,
        stock: sizeStockTotal,
      };
      await productApi.update(productId, dataToSubmit);
      router.push('/admin/products');
    } catch (err: unknown) {
      console.error('Failed to update product:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setErrors({
        general: error.response?.data?.message || 'Failed to update product. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addImage = () => {
    if (imageInput.trim() && !formData.images?.includes(imageInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), imageInput.trim()],
      }));
      setImageInput('');
    }
  };

  const handleImageFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingImages(true);
    setUploadError(null);
    try {
      const res = await mediaApi.uploadMultiple(files, 'products');
      const urls: string[] = res.data.map((f: { url: string }) => f.url);
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...urls],
      }));
    } catch (err: unknown) {
      console.error('Image upload failed:', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Upload failed. Please try again.';
      setUploadError(message);
    } finally {
      setIsUploadingImages(false);
      if (imageFileInputRef.current) imageFileInputRef.current.value = '';
    }
  };

  const removeImage = (image: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.filter((i) => i !== image) || [],
    }));
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">Loading product data...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-600 mb-4">The product you are trying to edit does not exist.</p>
        <button
          onClick={() => router.push('/admin/products')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="mt-2 text-sm text-gray-600">
          Update product information. Fields marked with * are required.
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter product name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="text-black w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter product description"
            />
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
              Gender *
            </label>
            <select
              id="gender"
              value={formData.genderId}
              onChange={(e) => setFormData((prev) => ({ ...prev, genderId: e.target.value }))}
              className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.genderId ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Gender</option>
              {genders.map((gender) => (
                <option key={gender._id} value={gender._id}>
                  {gender.name}
                </option>
              ))}
            </select>
            {errors.genderId && <p className="mt-1 text-sm text-red-600">{errors.genderId}</p>}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="category"
              value={formData.categoryId}
              onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
              disabled={!formData.genderId}
              className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.categoryId ? 'border-red-300' : 'border-gray-300'
              } ${!formData.genderId ? 'bg-gray-100' : ''}`}
            >
              <option value="">
                {formData.genderId ? 'Select Category' : 'Select Gender First'}
              </option>
              {filteredCategories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">₹</span>
              <input
                type="number"
                id="price"
                value={formData.price || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                }
                step="0.01"
                min="0"
                className={`w-full pl-7 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
          </div>

          {/* Discount Price */}
          <div>
            <label htmlFor="discountPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Discount Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">₹</span>
              <input
                type="number"
                id="discountPrice"
                value={formData.discountPrice || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    discountPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                step="0.01"
                min="0"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Badge */}
          <div>
            <label htmlFor="badge" className="block text-sm font-medium text-gray-700 mb-1">
              Promotional Badge
            </label>
            <select
              id="badge"
              value={formData.badge || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  badge: e.target.value ? (e.target.value as ProductBadge) : undefined,
                }))
              }
              className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">None</option>
              <option value="NEW">NEW</option>
              <option value="SALE">SALE</option>
              <option value="PREMIUM">PREMIUM</option>
              <option value="TRENDING">TRENDING</option>
              <option value="COMBO">COMBO</option>
              <option value="BEST_VALUE">BEST VALUE</option>
              <option value="LIMITED_SALE">LIMITED SALE</option>
              <option value="CASUAL">CASUAL</option>
              <option value="OFFER">OFFER</option>
              <option value="UNDER_1K">UNDER ₹1K</option>
              <option value="BUDGET_PICK">BUDGET PICK</option>
              <option value="LUXURY">LUXURY</option>
            </select>
          </div>

          {/* Is Active */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Product is Active
              </label>
            </div>
          </div>

          {/* Sizes + per-size stock */}
          <div className="md:col-span-2">
            <SizesAndStockEditor
              value={formData.sizeStock}
              onChange={(next) => setFormData((prev) => ({ ...prev, sizeStock: next }))}
            />
          </div>

          {/* Images */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
            <div className="mb-2">
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                multiple
                onChange={handleImageFilesSelected}
                className="hidden"
                id="product-image-upload"
              />
              <button
                type="button"
                onClick={() => imageFileInputRef.current?.click()}
                disabled={isUploadingImages}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {isUploadingImages ? 'Uploading...' : 'Upload Images'}
              </button>
              {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
            </div>
            <details className="mb-2">
              <summary className="text-xs text-gray-500 cursor-pointer">Or paste an image URL</summary>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="url"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                  className="text-black flex-1 text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter image URL"
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add
                </button>
              </div>
            </details>
            {formData.images && formData.images.length > 0 && (
              <div className="space-y-2">
                {formData.images.map((image, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span className="text-sm text-gray-600 truncate flex-1">{image}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(image)}
                      className="ml-2 text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-6 flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Updating...
              </span>
            ) : (
              'Update Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
