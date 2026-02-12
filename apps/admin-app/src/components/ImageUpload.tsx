'use client';

import React, { useState, useRef } from 'react';
import { Input, Button } from '@digital-order/ui';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  error?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Image',
  error,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB for original file)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Compress and convert to base64
      const compressedDataUrl = await compressImage(file);
      onChange(compressedDataUrl);
      setIsUploading(false);
    } catch (err) {
      setUploadError('Failed to process image');
      setIsUploading(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Target max ~400KB base64 to stay under Render/proxy limits (~500KB safe)
          const MAX_BASE64_BYTES = 400 * 1024;
          const attempts: { maxDimension: number; quality: number }[] = [
            { maxDimension: 800, quality: 0.6 },
            { maxDimension: 600, quality: 0.5 },
            { maxDimension: 480, quality: 0.4 },
          ];

          const tryCompress = (attemptIndex: number) => {
            const { maxDimension, quality } = attempts[attemptIndex];
            let width = img.width;
            let height = img.height;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height / width) * maxDimension;
                width = maxDimension;
              } else {
                width = (width / height) * maxDimension;
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            const result = canvas.toDataURL('image/jpeg', quality);

            // Base64 data URL: "data:image/jpeg;base64," + base64Payload
            const base64Length = result.length - result.indexOf(',') - 1;
            const estimatedBytes = (base64Length * 3) / 4;
            const isLastAttempt = attemptIndex === attempts.length - 1;
            if (estimatedBytes <= MAX_BASE64_BYTES || isLastAttempt) {
              resolve(result);
            } else {
              tryCompress(attemptIndex + 1);
            }
          };

          tryCompress(0);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInputMode('url')}
            className={`text-xs px-2 py-1 rounded ${
              inputMode === 'url'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            URL
          </button>
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            className={`text-xs px-2 py-1 rounded ${
              inputMode === 'upload'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Upload
          </button>
        </div>
      </div>

      {inputMode === 'url' ? (
        <Input
          type="url"
          placeholder="https://example.com/image.jpg"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      ) : (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Choose Image
              </>
            )}
          </Button>
          {uploadError && (
            <p className="text-sm text-red-600">{uploadError}</p>
          )}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      )}

      {/* Image Preview */}
      {value && (
        <div className="relative rounded-lg border border-gray-300 p-2 bg-gray-50">
          <div className="relative aspect-video w-full overflow-hidden rounded-md bg-gray-100">
            <img
              src={value}
              alt="Preview"
              className="object-cover w-full h-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
            title="Remove image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500">
        {inputMode === 'upload'
          ? 'Upload an image (max 10MB). Images are compressed to ~400KB for reliable uploads.'
          : 'Enter a URL to an image hosted online'
        }
      </p>
    </div>
  );
};
