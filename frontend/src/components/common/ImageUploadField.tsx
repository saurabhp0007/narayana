'use client';

import { useRef, useState } from 'react';
import { mediaApi } from '@/lib/api';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

export default function ImageUploadField({ value, onChange, folder = 'products', label }: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const res = await mediaApi.upload(file, folder);
      onChange(res.data.url);
    } catch (err: unknown) {
      console.error('Image upload failed:', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Upload failed. Please try again.';
      setError(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}

      <div className="flex items-start gap-3">
        {value ? (
          <img
            src={value}
            alt="Preview"
            className="h-20 w-20 object-cover rounded border border-gray-300 flex-shrink-0"
          />
        ) : (
          <div className="h-20 w-20 flex-shrink-0 bg-gray-100 rounded border border-dashed border-gray-300 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id={`upload-${folder}-${label}`}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : value ? 'Replace Image' : 'Upload Image'}
          </button>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="ml-2 text-xs text-gray-500 hover:text-red-600"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
