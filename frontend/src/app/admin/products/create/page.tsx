'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productApi, genderApi, categoryApi, mediaApi } from '@/lib/api';
import { Gender, Category, CreateProductDto } from '@/types';

interface FormErrors {
  name?: string;
  genderId?: string;
  categoryId?: string;
  price?: string;
  stock?: string;
  general?: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form data
  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    description: '',
    genderId: '',
    categoryId: '',
    price: 0,
    discountPrice: undefined,
    stock: 0,
    sizes: [],
    images: [],
    isActive: true,
    isBestSeller: false,
    showInLatestArrivals: false,
  });

  // Filter data
  const [genders, setGenders] = useState<Gender[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  // Sizes and images inputs
  const [sizeInput, setSizeInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gendersRes, categoriesRes] = await Promise.all([
          genderApi.getAll({ isActive: true }),
          categoryApi.getAll({ isActive: true }),
        ]);
        setGenders(Array.isArray(gendersRes.data) ? gendersRes.data : gendersRes.data.data || []);
        setCategories(
          Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data.data || []
        );
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setErrors({ general: 'Failed to load form data. Please refresh the page.' });
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.genderId) {
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
      setFormData((prev) => ({ ...prev, categoryId: '' }));
    }
  }, [formData.genderId, categories, formData.categoryId]);

  const selectedCategory = filteredCategories.find((cat) => cat._id === formData.categoryId);

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

    if (formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
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
      };
      await productApi.create(dataToSubmit);
      router.push('/admin/products');
    } catch (err: unknown) {
      console.error('Failed to create product:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setErrors({
        general: error.response?.data?.message || 'Failed to create product. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addSize = () => {
    if (sizeInput.trim() && !formData.sizes?.includes(sizeInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        sizes: [...(prev.sizes || []), sizeInput.trim()],
      }));
      setSizeInput('');
    }
  };

  const removeSize = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes?.filter((s) => s !== size) || [],
    }));
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Product</h1>
        <p className="mt-2 text-sm text-gray-600">
          Add a new product to your catalog. Fields marked with * are required.
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
            {selectedCategory?.showInLatestArrivals && (
              <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showInLatestArrivals"
                    checked={formData.showInLatestArrivals || false}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, showInLatestArrivals: e.target.checked }))
                    }
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showInLatestArrivals" className="ml-2 block text-sm text-emerald-900">
                    Show in Latest Arrivals (Homepage)
                  </label>
                </div>
                <p className="mt-1 text-xs text-emerald-700">
                  &quot;{selectedCategory.name}&quot; is live on the homepage. Turn this on to feature this specific
                  product in the Latest Arrivals slider — it won&apos;t show there until you do.
                </p>
              </div>
            )}
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
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
              <span className="absolute left-3 top-2 text-gray-500">$</span>
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

          {/* Stock */}
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
              Stock *
            </label>
            <input
              type="number"
              id="stock"
              value={formData.stock || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, stock: parseInt(e.target.value) || 0 }))
              }
              min="0"
              className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.stock ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0"
            />
            {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
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
                  badge: e.target.value ? (e.target.value as CreateProductDto['badge']) : undefined,
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
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isBestSeller"
                checked={formData.isBestSeller || false}
                onChange={(e) => setFormData((prev) => ({ ...prev, isBestSeller: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isBestSeller" className="ml-2 block text-sm text-gray-900">
                Best Seller (shows in homepage Best Sellers tab)
              </label>
            </div>
          </div>

          {/* Sizes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sizes</label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                className="text-black flex-1 text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter size (e.g., S, M, L, XL)"
              />
              <button
                type="button"
                onClick={addSize}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add
              </button>
            </div>
            {formData.sizes && formData.sizes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.sizes.map((size) => (
                  <span
                    key={size}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                  >
                    {size}
                    <button
                      type="button"
                      onClick={() => removeSize(size)}
                      className="ml-2 text-indigo-600 hover:text-indigo-900"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
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
                Creating...
              </span>
            ) : (
              'Create Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
